import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SchemaReloadControl() {
  const { toast } = useToast();
  const [isReloading, setIsReloading] = useState(false);
  const [lastReload, setLastReload] = useState<Date | null>(null);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');

  const checkHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      setHealthStatus('healthy');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus('unhealthy');
      return false;
    }
  };

  const reloadSchema = async () => {
    setIsReloading(true);
    try {
      // Try to call the reload function (may not exist yet if migration failed)
      const { data, error } = await supabase.rpc('reload_api_schema' as any);
      
      if (error) {
        // If RPC fails, provide manual instructions
        throw new Error('API unavailable - manual reload required');
      }
      
      // Wait a moment for reload to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check health
      const isHealthy = await checkHealth();
      
      if (isHealthy) {
        setLastReload(new Date());
        toast({
          title: 'Schema Reloaded Successfully',
          description: 'API schema cache has been refreshed. Job Search should work now.',
        });
      } else {
        throw new Error('Schema reloaded but health check still failing');
      }
    } catch (error: any) {
      console.error('Schema reload error:', error);
      toast({
        title: 'Schema Reload Failed',
        description: 'Please use manual SQL commands in Supabase dashboard.',
        variant: 'destructive',
      });
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          API Schema Control
        </CardTitle>
        <CardDescription>
          Emergency controls for PostgREST API schema cache issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Status */}
        <Alert className={
          healthStatus === 'healthy' ? 'border-green-500 bg-green-50' :
          healthStatus === 'unhealthy' ? 'border-red-500 bg-red-50' :
          'border-gray-300'
        }>
          <div className="flex items-center gap-2">
            {healthStatus === 'healthy' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {healthStatus === 'unhealthy' && <AlertTriangle className="h-4 w-4 text-red-600" />}
            <AlertDescription>
              <strong>API Status:</strong> {
                healthStatus === 'healthy' ? 'Healthy' :
                healthStatus === 'unhealthy' ? 'Unhealthy - Schema cache issue detected' :
                'Unknown - Click "Check Health" to test'
              }
            </AlertDescription>
          </div>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={checkHealth}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Health
          </Button>
          
          <Button
            onClick={reloadSchema}
            disabled={isReloading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Reloading...' : 'Reload API Schema'}
          </Button>
        </div>

        {/* Last Reload Info */}
        {lastReload && (
          <div className="text-sm text-muted-foreground">
            Last reload: {lastReload.toLocaleString()}
          </div>
        )}

        {/* Manual Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>If automatic reload fails:</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
              <li>Open Supabase Dashboard → SQL Editor</li>
              <li>Run: <code className="bg-gray-100 px-1 rounded">SELECT pg_notify('pgrst', 'reload schema');</code></li>
              <li>Run: <code className="bg-gray-100 px-1 rounded">SELECT pg_notify('pgrst', 'reload config');</code></li>
              <li>Click "Check Health" above to verify</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
