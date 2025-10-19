import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useHealthStore, manualHealthCheck } from '@/lib/health';
import { useToast } from '@/hooks/use-toast';

export function HealthStatusPanel() {
  const { apiMode, lastCheck, isChecking } = useHealthStore();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);

  const handleManualCheck = async () => {
    setIsRunning(true);
    try {
      const result = await manualHealthCheck();
      toast({
        title: result ? 'Health Check Passed' : 'Health Check Failed',
        description: result 
          ? 'API is responding normally' 
          : 'API is experiencing issues, using fallback mode',
        variant: result ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Health Check Error',
        description: 'Failed to run health check',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const isHealthy = apiMode === 'rest';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <p className="font-semibold">
                {isHealthy ? 'REST API Healthy' : 'Fallback Mode Active'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isHealthy 
                  ? 'All systems operating normally' 
                  : 'Using Edge Functions while API recovers'}
              </p>
            </div>
          </div>
          <Badge variant={isHealthy ? 'default' : 'secondary'}>
            {isHealthy ? 'Healthy' : 'Fallback'}
          </Badge>
        </div>

        {/* Last Check Time */}
        {lastCheck && (
          <div className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Manual Check Button */}
        <Button 
          onClick={handleManualCheck}
          disabled={isChecking || isRunning}
          className="w-full gap-2"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 ${(isChecking || isRunning) ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>

        {/* Info Box */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">What is Fallback Mode?</h4>
          <p className="text-sm text-muted-foreground">
            When PostgREST experiences issues (504 errors), the app automatically 
            switches to Edge Functions to keep data flowing. This ensures uninterrupted 
            service while the API recovers.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Performance:</strong> Edge fallback is slightly slower (~200-400ms) 
            but maintains full functionality. The system automatically switches back to 
            REST once the API recovers.
          </p>
        </div>

        {/* Status Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">API Mode:</span>
            <span className="font-mono">{apiMode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Health Monitoring:</span>
            <span className={isChecking ? 'text-blue-600' : 'text-green-600'}>
              {isChecking ? 'Checking...' : 'Active (30s intervals)'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
