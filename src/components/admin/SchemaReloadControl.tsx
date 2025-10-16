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
      // Try the RPC health check first
      const { data, error } = await supabase.rpc('api_health_check' as any);
      
      if (error) {
        console.error('Health check RPC failed:', error);
        
        // If we get PGRST002, PostgREST is down but DB might be OK
        if (error.code === 'PGRST002') {
          setHealthStatus('unhealthy');
          toast({
            title: '⚠️ PostgREST Schema Cache Error',
            description: 'The API layer cannot query its schema. The database may be healthy but API is down. Run the V3 SQL fix script.',
            variant: 'destructive',
            duration: 10000,
          });
          return false;
        }
        
        setHealthStatus('unhealthy');
        return false;
      }
      
      if (data?.healthy) {
        setHealthStatus('healthy');
        return true;
      } else {
        setHealthStatus('unhealthy');
        return false;
      }
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
            <strong className="text-red-900">🚨 CRITICAL: PostgREST Schema Cache Failure</strong>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-red-800 font-medium">
                The database is healthy but PostgREST (API layer) cannot query its schema cache.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 my-2">
                <p className="text-xs font-bold text-yellow-900">DIAGNOSIS:</p>
                <p className="text-xs text-yellow-800 mt-1">
                  ✅ Database: Healthy (SQL queries work)<br/>
                  ❌ PostgREST API: Down (PGRST002 error)<br/>
                  📊 Impact: UI cannot load data via REST API
                </p>
              </div>
              <p className="text-sm text-red-800 font-bold mt-3">
                🔧 RUN THIS FINAL FIX:
              </p>
              <ol className="ml-4 list-decimal space-y-2 text-sm text-red-800">
                <li>
                  <strong>Open Supabase SQL Editor</strong>
                  <div className="ml-4 mt-1">
                    <a 
                      href="https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline font-bold"
                    >
                      → CLICK HERE TO OPEN SQL EDITOR ←
                    </a>
                  </div>
                </li>
                <li>
                  <strong>Copy ALL code from: <code className="bg-red-100 px-1 rounded">EMERGENCY_SQL_FIX_V3_FINAL.sql</code></strong>
                  <div className="ml-4 mt-1 text-xs">
                    Location: Project root folder
                  </div>
                </li>
                <li><strong>Paste and click "Run"</strong> - wait 30-60 seconds</li>
                <li><strong>Check output</strong> - should show "RECOVERY V3 COMPLETE"</li>
                <li><strong>Wait 30 seconds</strong> for PostgREST to fully reload</li>
                <li><strong>Click "Check Health"</strong> above</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-900 font-bold">
                  💡 IF STILL FAILING:
                </p>
                <ul className="ml-4 mt-1 text-xs text-blue-800 list-disc">
                  <li><strong>PostgREST needs a hard restart</strong> (only Supabase support can do this)</li>
                  <li>Contact Supabase: Settings → Support → Report "PGRST002 schema cache error"</li>
                  <li>Meanwhile: App will use direct database function fallback</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
