import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle, Activity, Shield, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheck {
  status: 'unknown' | 'healthy' | 'unhealthy';
  lastCheck: Date | null;
  details: string;
}

export function SystemDoctor() {
  const { toast } = useToast();
  const [health, setHealth] = useState<HealthCheck>({
    status: 'unknown',
    lastCheck: null,
    details: 'Not checked yet'
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [grantsAudit, setGrantsAudit] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      console.log('🏥 Running health check...');
      
      // Test 1: Try to query jobs_db directly
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs_db')
        .select('id')
        .limit(1);

      if (jobsError) {
        if (jobsError.code === 'PGRST002') {
          setHealth({
            status: 'unhealthy',
            lastCheck: new Date(),
            details: 'PGRST002: PostgREST cannot query schema cache. Fallback mode required.'
          });
          toast({
            title: '⚠️ PostgREST Schema Cache Error',
            description: 'API layer is down. Run RECOVERY_SAFE.sql to enable fallback.',
            variant: 'destructive',
            duration: 8000
          });
          return false;
        }
        
        setHealth({
          status: 'unhealthy',
          lastCheck: new Date(),
          details: `Error: ${jobsError.message}`
        });
        return false;
      }

      // Test 2: Try fallback RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_jobs_direct' as any, {
        p_limit: 1,
        p_offset: 0
      });

      const fallbackWorking = !rpcError && rpcData && rpcData.length >= 0;

      if (jobsData) {
        setHealth({
          status: 'healthy',
          lastCheck: new Date(),
          details: `REST API healthy. Fallback ${fallbackWorking ? 'also available' : 'not needed'}.`
        });
        toast({
          title: '✅ System Healthy',
          description: 'All systems operational.',
          duration: 3000
        });
        return true;
      }

      setHealth({
        status: 'unhealthy',
        lastCheck: new Date(),
        details: 'Unknown error during health check'
      });
      return false;

    } catch (error: any) {
      console.error('Health check error:', error);
      setHealth({
        status: 'unhealthy',
        lastCheck: new Date(),
        details: error.message || 'Health check failed'
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const reloadSchema = async () => {
    setIsReloading(true);
    try {
      console.log('🔄 Reloading PostgREST schema...');
      
      // Call the safe reload function
      const { data, error } = await supabase.rpc('reload_api_schema' as any);
      
      if (error) {
        throw error;
      }

      toast({
        title: '🔄 Schema Reload Requested',
        description: 'Waiting for PostgREST to process...',
        duration: 3000
      });

      // Wait for reload to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check health after reload
      const isHealthy = await checkHealth();
      
      if (isHealthy) {
        toast({
          title: '✅ Reload Successful',
          description: 'System is now healthy.',
          duration: 5000
        });
      } else {
        toast({
          title: '⚠️ Reload Complete, But Issues Remain',
          description: 'Run RECOVERY_SAFE.sql in SQL Editor if issues persist.',
          variant: 'destructive',
          duration: 8000
        });
      }

    } catch (error: any) {
      console.error('Schema reload error:', error);
      toast({
        title: '❌ Reload Failed',
        description: 'Manual SQL execution may be required.',
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsReloading(false);
    }
  };

  const auditGrants = async () => {
    setIsAuditing(true);
    try {
      console.log('🔍 Auditing grants and RLS...');

      const checks = {
        jobs_db: { table: 'jobs_db', canSelect: false, error: null },
        customers_db: { table: 'customers_db', canSelect: false, error: null },
        fallback_rpc: { name: 'get_jobs_direct', canExecute: false, error: null }
      };

      // Test jobs_db
      try {
        await supabase.from('jobs_db').select('id').limit(1);
        checks.jobs_db.canSelect = true;
      } catch (err: any) {
        checks.jobs_db.error = err.message;
      }

      // Test customers_db
      try {
        await supabase.from('customers_db').select('id').limit(1);
        checks.customers_db.canSelect = true;
      } catch (err: any) {
        checks.customers_db.error = err.message;
      }

      // Test fallback RPC
      try {
        await supabase.rpc('get_jobs_direct' as any, { p_limit: 1, p_offset: 0 });
        checks.fallback_rpc.canExecute = true;
      } catch (err: any) {
        checks.fallback_rpc.error = err.message;
      }

      setGrantsAudit(checks);

      const allPassed = checks.jobs_db.canSelect && 
                       checks.customers_db.canSelect && 
                       checks.fallback_rpc.canExecute;

      if (allPassed) {
        toast({
          title: '✅ Grants & RLS Audit Passed',
          description: 'All required permissions are in place.',
          duration: 5000
        });
      } else {
        toast({
          title: '⚠️ Permission Issues Detected',
          description: 'Check audit results below.',
          variant: 'destructive',
          duration: 8000
        });
      }

    } catch (error: any) {
      console.error('Grants audit error:', error);
      toast({
        title: '❌ Audit Failed',
        description: error.message,
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Doctor - One-Click Recovery
        </CardTitle>
        <CardDescription>
          Non-destructive health checks and safe repairs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Status */}
        <Alert className={
          health.status === 'healthy' ? 'border-green-500 bg-green-50' :
          health.status === 'unhealthy' ? 'border-red-500 bg-red-50' :
          'border-gray-300'
        }>
          <div className="flex items-start gap-3">
            {health.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
            {health.status === 'unhealthy' && <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />}
            {health.status === 'unknown' && <Database className="h-5 w-5 text-gray-600 mt-0.5" />}
            <div className="flex-1">
              <AlertDescription>
                <strong>System Status:</strong> {
                  health.status === 'healthy' ? 'Healthy ✅' :
                  health.status === 'unhealthy' ? 'Unhealthy ⚠️' :
                  'Unknown (not checked)'
                }
                <div className="text-sm mt-1 text-muted-foreground">
                  {health.details}
                </div>
                {health.lastCheck && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Last checked: {health.lastCheck.toLocaleString()}
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            onClick={checkHealth}
            disabled={isChecking}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Health'}
          </Button>
          
          <Button
            onClick={reloadSchema}
            disabled={isReloading}
            variant="outline"
            className="gap-2"
          >
            <Database className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Reloading...' : 'Reload Schema'}
          </Button>

          <Button
            onClick={auditGrants}
            disabled={isAuditing}
            variant="outline"
            className="gap-2"
          >
            <Shield className={`h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditing...' : 'Audit Grants'}
          </Button>
        </div>

        {/* Grants Audit Results */}
        {grantsAudit && (
          <Alert className="border-blue-500 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong className="text-blue-900">Grants & RLS Audit Results:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <div className={grantsAudit.jobs_db.canSelect ? 'text-green-700' : 'text-red-700'}>
                  {grantsAudit.jobs_db.canSelect ? '✅' : '❌'} jobs_db SELECT
                  {grantsAudit.jobs_db.error && ` (${grantsAudit.jobs_db.error})`}
                </div>
                <div className={grantsAudit.customers_db.canSelect ? 'text-green-700' : 'text-red-700'}>
                  {grantsAudit.customers_db.canSelect ? '✅' : '❌'} customers_db SELECT
                  {grantsAudit.customers_db.error && ` (${grantsAudit.customers_db.error})`}
                </div>
                <div className={grantsAudit.fallback_rpc.canExecute ? 'text-green-700' : 'text-red-700'}>
                  {grantsAudit.fallback_rpc.canExecute ? '✅' : '❌'} get_jobs_direct RPC
                  {grantsAudit.fallback_rpc.error && ` (${grantsAudit.fallback_rpc.error})`}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recovery Instructions */}
        {health.status === 'unhealthy' && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong className="text-orange-900">🔧 Recovery Required</strong>
              <div className="mt-2 space-y-2 text-sm text-orange-800">
                <p className="font-medium">
                  Run RECOVERY_SAFE.sql in Supabase SQL Editor (one time only):
                </p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>
                    <a 
                      href="https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline font-bold"
                    >
                      → Open SQL Editor
                    </a>
                  </li>
                  <li>Copy ALL code from <code className="bg-orange-100 px-1 rounded">RECOVERY_SAFE.sql</code></li>
                  <li>Paste and click "Run" (safe, non-destructive)</li>
                  <li>Wait for "✅ RECOVERY_SAFE COMPLETED" message</li>
                  <li>Refresh this page - jobs will load in fallback mode</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
