import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { apiHealth, getJobsListSimple } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ForensicsPanel() {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: 'success' | 'error';
    message: string;
    timestamp: Date;
  } | null>(null);
  const [rpcTestResult, setRpcTestResult] = useState<{
    status: 'success' | 'error';
    message: string;
    elapsed: number;
    timestamp: Date;
  } | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      await apiHealth();
      setLastResult({
        status: 'success',
        message: 'REST API healthy',
        timestamp: new Date()
      });
      toast({
        title: 'Health Check Passed',
        description: 'REST API is responding normally'
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to run health check';
      setLastResult({
        status: 'error',
        message: errorMessage,
        timestamp: new Date()
      });
      toast({
        variant: 'destructive',
        title: 'Health Check Error',
        description: errorMessage
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testJobsRPC = async () => {
    setIsTesting(true);
    const startTime = performance.now();
    try {
      await getJobsListSimple({ limit: 1, offset: 0 });
      const elapsed = Math.round(performance.now() - startTime);
      setRpcTestResult({
        status: 'success',
        message: 'RPC test passed',
        elapsed,
        timestamp: new Date()
      });
      toast({
        title: 'RPC Test Passed',
        description: `Loaded in ${elapsed}ms`
      });
    } catch (error: any) {
      const elapsed = Math.round(performance.now() - startTime);
      const errorMessage = error.message || 'Failed to test RPC';
      setRpcTestResult({
        status: 'error',
        message: errorMessage,
        elapsed,
        timestamp: new Date()
      });
      toast({
        variant: 'destructive',
        title: 'RPC Test Failed',
        description: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          API Forensics & Health Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={runHealthCheck}
            disabled={isChecking}
            className="gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Run Health Check
          </Button>

          <Button 
            onClick={testJobsRPC}
            disabled={isTesting}
            variant="outline"
            className="gap-2"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Test Jobs RPC
          </Button>
          
          {lastResult && (
            <div className="flex items-center gap-2">
              {lastResult.status === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="default">REST Healthy</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">Error</Badge>
                </>
              )}
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="grid md:grid-cols-2 gap-4">
          {lastResult && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Health Check</span>
                <span className="text-xs text-muted-foreground">
                  {lastResult.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className={`text-sm ${lastResult.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {lastResult.message}
              </div>
            </div>
          )}

          {rpcTestResult && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Jobs RPC Test</span>
                <span className="text-xs text-muted-foreground">
                  {rpcTestResult.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className={`text-sm ${rpcTestResult.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {rpcTestResult.message} ({rpcTestResult.elapsed}ms)
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">About Health Checks</h4>
          <p className="text-sm text-muted-foreground">
            This diagnostic tool tests the PostgREST API connection by calling the 
            <code className="mx-1 px-1.5 py-0.5 bg-background rounded">api_health_check</code> 
            RPC function. If the check fails with a 504 or connection error, the app 
            will automatically fall back to Edge Functions to keep data flowing.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Common Issues:</strong>
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
            <li>504 Gateway Timeout: PostgREST schema cache issue (requires restart)</li>
            <li>Connection refused: Network or firewall issue</li>
            <li>Function not found: Database migration not applied</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
