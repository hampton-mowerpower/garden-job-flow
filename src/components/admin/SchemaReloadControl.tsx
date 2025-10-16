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
      // Try to call the reload function
      const { data, error } = await supabase.rpc('reload_api_schema' as any);
      
      if (error) {
        console.error('RPC error:', error);
        toast({
          title: 'Manual SQL Required',
          description: 'API is down. Run EMERGENCY_SQL_FIX.sql in Supabase SQL Editor.',
          variant: 'destructive',
          duration: 10000,
        });
        setHealthStatus('unhealthy');
        return;
      }
      
      // Wait for reload to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check health
      const isHealthy = await checkHealth();
      
      if (isHealthy) {
        setLastReload(new Date());
        toast({
          title: '✅ Schema Reloaded',
          description: 'API is healthy. Test Job Search now.',
          duration: 5000,
        });
      } else {
        toast({
          title: '⚠️ Partial Success',
          description: 'Schema reloaded but health check still failing. Check RLS policies.',
          variant: 'destructive',
          duration: 8000,
        });
      }
    } catch (error: any) {
      console.error('Schema reload error:', error);
      toast({
        title: '❌ Reload Failed',
        description: error.message || 'Check console for details.',
        variant: 'destructive',
        duration: 10000,
      });
      setHealthStatus('unhealthy');
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

        {/* Emergency Instructions */}
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong className="text-red-900">🚨 EMERGENCY: If API is completely down:</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-red-800">
              <li>Open Supabase Dashboard → SQL Editor</li>
              <li><strong>Copy and run ALL commands from EMERGENCY_SQL_FIX.sql</strong></li>
              <li>Wait 10 seconds for PostgREST to reload</li>
              <li>Click "Check Health" above</li>
              <li>If still failing, check for broken views in the SQL output</li>
            </ol>
            <p className="mt-3 text-xs text-red-700 font-medium">
              File location: <code className="bg-red-100 px-1 rounded">EMERGENCY_SQL_FIX.sql</code> (root directory)
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
