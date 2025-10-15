import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface IntegrityIssue {
  issue_type: string;
  table_name: string;
  record_id: string;
  details: Record<string, any>;
}

export function DataIntegrityMonitor() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_jobs: 0,
    total_customers: 0,
    issues_found: 0,
    last_check: new Date()
  });

  useEffect(() => {
    loadIntegrityCheck();
  }, []);

  const loadIntegrityCheck = async () => {
    setLoading(true);
    try {
      // Check for data drift
      const { data: driftData, error: driftError } = await supabase
        .rpc('detect_data_drift' as any);

      if (driftError) throw driftError;

      // Get stats
      const { count: jobCount } = await supabase
        .from('jobs_db')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      const { count: customerCount } = await supabase
        .from('customers_db')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      setIssues((driftData || []) as IntegrityIssue[]);
      setStats({
        total_jobs: jobCount || 0,
        total_customers: customerCount || 0,
        issues_found: (driftData as any)?.length || 0,
        last_check: new Date()
      });

      if (driftData && (driftData as any[]).length > 0) {
        toast({
          title: "Data Integrity Issues Found",
          description: `Found ${(driftData as any[]).length} issues requiring attention`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "System Healthy",
          description: "No data integrity issues detected",
        });
      }
    } catch (error) {
      console.error('Error checking data integrity:', error);
      toast({
        title: "Check Failed",
        description: "Failed to run integrity check",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getIssueLabel = (issueType: string) => {
    const labels: Record<string, { text: string; variant: 'destructive' | 'default' | 'secondary' }> = {
      'deleted_customer_reference': { text: 'Deleted Customer', variant: 'destructive' },
      'missing_customer': { text: 'Missing Customer', variant: 'destructive' },
      'merged_customer_reference': { text: 'Merged Customer', variant: 'secondary' }
    };
    return labels[issueType] || { text: issueType, variant: 'default' };
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      issues
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Integrity report downloaded successfully"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Integrity Monitor</CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadIntegrityCheck} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total_jobs}</div>
                <div className="text-sm text-muted-foreground">Total Jobs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total_customers}</div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${stats.issues_found === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.issues_found}
                </div>
                <div className="text-sm text-muted-foreground">Issues Found</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {stats.issues_found === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="text-sm font-medium">
                    {stats.issues_found === 0 ? 'Healthy' : 'Issues Detected'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last check: {stats.last_check.toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {issues.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Data Integrity Issues</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue, idx) => {
                    const label = getIssueLabel(issue.issue_type);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant={label.variant}>{label.text}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{issue.table_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {issue.details.job_number && (
                              <div><strong>Job:</strong> {issue.details.job_number}</div>
                            )}
                            {issue.details.customer_id && (
                              <div className="font-mono text-xs">{issue.details.customer_id}</div>
                            )}
                            {issue.details.merged_into && (
                              <div className="text-xs text-muted-foreground">
                                Merged into: {issue.details.merged_into}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Investigate</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {issues.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="font-medium">No data integrity issues detected</p>
              <p className="text-sm mt-1">All jobs have valid customer references</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
