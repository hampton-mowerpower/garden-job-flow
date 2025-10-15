import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/calculations';
import { Eye, FileText } from 'lucide-react';

interface JobData {
  id: string;
  job_number: string;
  status: string;
  created_at: string;
  grand_total: number;
  balance_due: number;
  machine_category: string;
  machine_brand: string;
  machine_model: string;
  problem_description: string;
  notes?: string;
}

interface CustomerJobsTabProps {
  customerId: string;
}

export function CustomerJobsTab({ customerId }: CustomerJobsTabProps) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalSpent: 0,
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    loadJobs();
  }, [customerId]);

  const loadJobs = async () => {
    try {
      // Load live jobs data - no caching
      const { data, error } = await supabase
        .from('jobs_db')
        .select('*')
        .eq('customer_id', customerId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobsData = data || [];
      setJobs(jobsData);

      // Compute live stats
      setStats({
        total: jobsData.length,
        totalSpent: jobsData.reduce((sum, j) => sum + (j.grand_total || 0), 0),
        pending: jobsData.filter(j => j.status === 'pending' || j.status === 'in-progress').length,
        completed: jobsData.filter(j => j.status === 'completed' || j.status === 'delivered').length
      });
    } catch (error: any) {
      console.error('Error loading customer jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800' },
      'delivered': { label: 'Delivered', className: 'bg-purple-100 text-purple-800' },
      'write_off': { label: 'Write Off', className: 'bg-red-100 text-red-800' }
    };
    const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Live Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Active Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found for this customer
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.job_number}</TableCell>
                    <TableCell>{format(new Date(job.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{job.machine_category}</div>
                        <div className="text-muted-foreground">{job.machine_brand} {job.machine_model}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {job.problem_description || job.notes || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{formatCurrency(job.grand_total)}</TableCell>
                    <TableCell>
                      <span className={job.balance_due > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        {formatCurrency(job.balance_due)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}