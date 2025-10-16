import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BaselineJob {
  jobNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
}

interface Mismatch {
  jobNumber: string;
  type: 'MISSING' | 'MISMATCH' | 'EXTRA';
  baselineCustomer?: string;
  actualCustomer?: string;
  baselineCustomerId?: string;
  actualCustomerId?: string;
}

export function JobReconciliation() {
  const { toast } = useToast();
  const [baseline, setBaseline] = useState<BaselineJob[]>([]);
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setBaseline(json);
        toast({
          title: 'Baseline Loaded',
          description: `Loaded ${json.length} jobs from baseline`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid JSON file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const analyzeReconciliation = async () => {
    if (baseline.length === 0) {
      toast({
        title: 'No Baseline',
        description: 'Please upload a baseline file first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch all current jobs
      const { data: currentJobs, error } = await supabase
        .from('jobs_db')
        .select('id, job_number, customer_id, customers_db!inner(id, name, phone)')
        .is('deleted_at', null);

      if (error) throw error;

      const issues: Mismatch[] = [];

      // Check each baseline job
      for (const baseJob of baseline) {
        const actualJob = currentJobs?.find(j => j.job_number === baseJob.jobNumber);

        if (!actualJob) {
          issues.push({
            jobNumber: baseJob.jobNumber,
            type: 'MISSING',
            baselineCustomer: baseJob.customer.name,
            baselineCustomerId: baseJob.customer.id
          });
        } else {
          const actualCustomer = (actualJob as any).customers_db;
          if (actualCustomer?.id !== baseJob.customer.id) {
            issues.push({
              jobNumber: baseJob.jobNumber,
              type: 'MISMATCH',
              baselineCustomer: baseJob.customer.name,
              actualCustomer: actualCustomer?.name,
              baselineCustomerId: baseJob.customer.id,
              actualCustomerId: actualCustomer?.id
            });
          }
        }
      }

      // Check for extra jobs (in DB but not in baseline)
      currentJobs?.forEach((actualJob: any) => {
        const inBaseline = baseline.find(b => b.jobNumber === actualJob.job_number);
        if (!inBaseline) {
          issues.push({
            jobNumber: actualJob.job_number,
            type: 'EXTRA',
            actualCustomer: actualJob.customers_db?.name,
            actualCustomerId: actualJob.customers_db?.id
          });
        }
      });

      setMismatches(issues);
      setAnalyzed(true);
      
      toast({
        title: 'Analysis Complete',
        description: `Found ${issues.length} discrepancies`,
        variant: issues.length > 0 ? 'destructive' : 'default'
      });
    } catch (error: any) {
      console.error('Error analyzing reconciliation:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportMismatches = () => {
    const csv = [
      ['Job Number', 'Issue Type', 'Baseline Customer', 'Actual Customer', 'Baseline ID', 'Actual ID'].join(','),
      ...mismatches.map(m => 
        [
          m.jobNumber,
          m.type,
          m.baselineCustomer || '',
          m.actualCustomer || '',
          m.baselineCustomerId || '',
          m.actualCustomerId || ''
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-reconciliation-mismatches-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Mismatches CSV downloaded',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job List Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Upload Baseline (JSON from {new Date().toISOString().split('T')[0]})
              </label>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
              />
            </div>
            <Button 
              onClick={analyzeReconciliation} 
              disabled={loading || baseline.length === 0}
              className="mt-6"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Analyze
            </Button>
          </div>

          {baseline.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Baseline loaded: {baseline.length} jobs
            </div>
          )}

          {analyzed && (
            <>
              <div className="flex gap-4 items-center pt-4 border-t">
                <div className="flex-1">
                  <div className="text-2xl font-bold">
                    {mismatches.length === 0 ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6" />
                        All Jobs Match
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        {mismatches.length} Discrepancies Found
                      </span>
                    )}
                  </div>
                </div>
                {mismatches.length > 0 && (
                  <Button onClick={exportMismatches} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              {mismatches.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Baseline Customer</TableHead>
                      <TableHead>Actual Customer</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mismatches.map((mismatch, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{mismatch.jobNumber}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              mismatch.type === 'MISSING' ? 'destructive' : 
                              mismatch.type === 'MISMATCH' ? 'default' : 
                              'secondary'
                            }
                          >
                            {mismatch.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{mismatch.baselineCustomer || '-'}</TableCell>
                        <TableCell>{mismatch.actualCustomer || '-'}</TableCell>
                        <TableCell>
                          {mismatch.type === 'MISMATCH' && (
                            <Button size="sm" variant="outline">
                              Re-link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}