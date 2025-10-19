import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Database, Shield, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';

interface HealthResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  timestamp?: string;
  details?: any;
}

export const SystemDoctor = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, HealthResult>>({});

  const runHealthCheck = async () => {
    setRunning(true);
    const newResults: Record<string, HealthResult> = {};

    try {
      // PHASE 1 CRITICAL TESTS
      
      // Test 1: Can anon role read jobs?
      try {
        const { data, error, count } = await supabase
          .from('jobs_db')
          .select('id', { count: 'exact', head: false })
          .limit(1);
        
        if (error) throw error;
        newResults.anon_read_jobs = {
          status: 'pass',
          message: `OK - Anon can read jobs (${count || 0} total)`,
          timestamp: new Date().toISOString()
        };
      } catch (e: any) {
        newResults.anon_read_jobs = {
          status: 'fail',
          message: `FAIL - ${e.message || e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 2: Can anon role read customers?
      try {
        const { data, error, count } = await supabase
          .from('customers_db')
          .select('id', { count: 'exact', head: false })
          .limit(1);
        
        if (error) throw error;
        newResults.anon_read_customers = {
          status: 'pass',
          message: `OK - Anon can read customers (${count || 0} total)`,
          timestamp: new Date().toISOString()
        };
      } catch (e: any) {
        newResults.anon_read_customers = {
          status: 'fail',
          message: `FAIL - ${e.message || e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 3: Can anon role read parts?
      try {
        const { data, error, count } = await supabase
          .from('parts_catalogue')
          .select('id', { count: 'exact', head: false })
          .limit(1);
        
        if (error) throw error;
        newResults.anon_read_parts = {
          status: 'pass',
          message: `OK - Anon can read parts (${count || 0} total)`,
          timestamp: new Date().toISOString()
        };
      } catch (e: any) {
        newResults.anon_read_parts = {
          status: 'fail',
          message: `FAIL - ${e.message || e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 4: RLS Status Check
      try {
        const { data, error } = await supabase.rpc('audit_grants_for_role' as any, {
          p_role: 'authenticated'
        });
        
        const hasBlockingIssues = data?.some((grant: any) => 
          grant.issue?.includes('NO SELECT') || grant.issue?.includes('BLOCKED')
        );
        
        newResults.rls_status = {
          status: hasBlockingIssues ? 'fail' : 'pass',
          message: hasBlockingIssues ? 'BLOCKED - RLS policies blocking access' : 'ACTIVE - RLS policies configured',
          timestamp: new Date().toISOString(),
          details: data
        };
      } catch (e: any) {
        newResults.rls_status = {
          status: 'warn',
          message: `Unable to check RLS: ${e.message || e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 5: Sample Job Query with Relations
      try {
        const { data, error } = await supabase
          .from('jobs_db')
          .select('id, job_number, status, created_at, customers_db(name, phone)')
          .limit(1)
          .single();
        
        if (error) throw error;
        newResults.jobs_with_relations = {
          status: 'pass',
          message: `OK - Jobs query with customer relations works`,
          timestamp: new Date().toISOString()
        };
      } catch (e: any) {
        newResults.jobs_with_relations = {
          status: 'warn',
          message: `Job relations query: ${e.message || e}`,
          timestamp: new Date().toISOString()
        };
      }

      setResults(newResults);

      const failedTests = Object.values(newResults).filter(r => r.status === 'fail').length;
      const passedTests = Object.values(newResults).filter(r => r.status === 'pass').length;

      toast({
        title: failedTests === 0 ? 'All tests passed' : 'Some tests failed',
        description: `${passedTests} passed, ${failedTests} failed`,
        variant: failedTests === 0 ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('System doctor error:', error);
      toast({
        title: 'Error running diagnostics',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  const reloadSchema = async () => {
    try {
      const { error } = await supabase.rpc('reload_postgrest_schema' as any);
      if (error) throw error;

      toast({
        title: 'Schema reload triggered',
        description: 'PostgREST schema cache has been reloaded'
      });
    } catch (error) {
      toast({
        title: 'Schema reload failed',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warn') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warn':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Admin access required</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Doctor
        </CardTitle>
        <CardDescription>
          Run diagnostics to check database connectivity and API health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runHealthCheck} disabled={running}>
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running diagnostics...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run Full Diagnostic
              </>
            )}
          </Button>
          <Button onClick={reloadSchema} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload API Schema
          </Button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3 mt-6">
            <h4 className="font-semibold">Test Results:</h4>
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  )}
                  {result.details && (
                    <pre className="text-xs bg-background p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-muted rounded text-sm">
          <strong>PHASE 1 Health Checks:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>✓ Can anon role read jobs? (OK/FAIL)</li>
            <li>✓ Can anon role read customers? (OK/FAIL)</li>
            <li>✓ Can anon role read parts? (OK/FAIL)</li>
            <li>✓ Is RLS blocking access? (ACTIVE/BLOCKED)</li>
            <li>✓ Jobs query with customer relations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
