import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ShadowAuditEntry {
  id: string;
  audit_type: string;
  table_name: string;
  record_id: string;
  severity: 'info' | 'warning' | 'critical';
  detected_at: string;
  details: any;
  resolved_at?: string;
}

export function ShadowAuditMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const { data: auditEntries, refetch, isLoading } = useQuery({
    queryKey: ['shadow-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shadow_audit_log')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ShadowAuditEntry[];
    },
    refetchInterval: isMonitoring ? 60000 : false // Refetch every minute when monitoring
  });

  const unresolvedCount = auditEntries?.filter(e => !e.resolved_at).length || 0;
  const criticalCount = auditEntries?.filter(e => e.severity === 'critical' && !e.resolved_at).length || 0;
  const warningCount = auditEntries?.filter(e => e.severity === 'warning' && !e.resolved_at).length || 0;

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    setLastCheck(new Date());
    toast.success(isMonitoring ? 'Monitoring stopped' : 'Monitoring started');
  };

  const handleResolve = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('shadow_audit_log')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', entryId);
      
      if (error) throw error;
      
      toast.success('Entry marked as resolved');
      refetch();
    } catch (error: any) {
      toast.error(`Failed to resolve: ${error.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const getAuditTypeLabel = (type: string) => {
    switch (type) {
      case 'customer_relink': return 'Customer Relink';
      case 'total_drift': return 'Total Drift';
      case 'unauthorized_write': return 'Unauthorized Write';
      case 'silent_deletion': return 'Silent Deletion';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unresolved</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Issues detected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">
              Need review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {isMonitoring ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMonitoring ? 'Active' : 'Paused'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastCheck ? `Last: ${lastCheck.toLocaleTimeString()}` : 'Not started'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shadow Audit Log</CardTitle>
              <CardDescription>
                Real-time monitoring for data integrity issues
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant={isMonitoring ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleMonitoring}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {unresolvedCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">No issues detected</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditEntries?.filter(e => !e.resolved_at).map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(entry.severity) as any}>
                        {entry.severity.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">
                        {getAuditTypeLabel(entry.audit_type)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolve(entry.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Table:</span>{' '}
                      <code className="px-1 py-0.5 bg-muted rounded">{entry.table_name}</code>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Record ID:</span>{' '}
                      <code className="px-1 py-0.5 bg-muted rounded text-xs">{entry.record_id}</code>
                    </p>
                    <p className="text-muted-foreground">
                      Detected: {new Date(entry.detected_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {entry.details && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
