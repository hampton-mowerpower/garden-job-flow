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
      // Test 1: Health Check RPC
      try {
        const { data, error } = await supabase.rpc('health_check' as any);
        if (error) throw error;
        newResults.health_check = {
          status: 'pass',
          message: 'Health check passed',
          timestamp: new Date().toISOString(),
          details: data
        };
      } catch (e) {
        newResults.health_check = {
          status: 'fail',
          message: `Health check failed: ${e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 2: Sample Query (Jobs List)
      try {
        const { data, error } = await supabase
          .from('jobs_db')
          .select('id, job_number, status, created_at')
          .limit(5);
        
        if (error) throw error;
        newResults.jobs_query = {
          status: 'pass',
          message: `Successfully queried ${data?.length || 0} jobs`,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        newResults.jobs_query = {
          status: 'fail',
          message: `Jobs query failed: ${e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 3: Customers Query
      try {
        const { data, error } = await supabase
          .from('customers_db')
          .select('id, name, phone')
          .limit(5);
        
        if (error) throw error;
        newResults.customers_query = {
          status: 'pass',
          message: `Successfully queried ${data?.length || 0} customers`,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        newResults.customers_query = {
          status: 'fail',
          message: `Customers query failed: ${e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 4: Parts Query
      try {
        const { data, error } = await supabase
          .from('parts_catalogue')
          .select('id, name, sell_price')
          .limit(5);
        
        if (error) throw error;
        newResults.parts_query = {
          status: 'pass',
          message: `Successfully queried ${data?.length || 0} parts`,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        newResults.parts_query = {
          status: 'fail',
          message: `Parts query failed: ${e}`,
          timestamp: new Date().toISOString()
        };
      }

      // Test 5: Email Outbox
      try {
        const { data, error } = await supabase
          .from('email_outbox')
          .select('id, status, created_at')
          .limit(5);
        
        if (error) throw error;
        newResults.email_outbox = {
          status: 'pass',
          message: `Email outbox accessible (${data?.length || 0} recent)`,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        newResults.email_outbox = {
          status: 'warn',
          message: `Email outbox check: ${e}`,
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
          <strong>What this checks:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Database health and connectivity</li>
            <li>Jobs, Customers, and Parts table access</li>
            <li>Email queue system status</li>
            <li>API schema cache status</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
