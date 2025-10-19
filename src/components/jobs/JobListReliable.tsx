import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Job {
  id: string;
  job_number: string;
  created_at: string;
  status: string;
  grand_total: number;
  balance_due: number;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  machine_category?: string;
  machine_brand?: string;
  machine_model?: string;
  problem_description?: string;
}

export const JobListReliable = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[JobListReliable] Loading jobs...');
      
      // Query with customer relation join
      const { data, error: err, count } = await supabase
        .from('jobs_db')
        .select(`
          id,
          job_number,
          created_at,
          status,
          grand_total,
          balance_due,
          customer_id,
          machine_category,
          machine_brand,
          machine_model,
          machine_serial,
          problem_description,
          version,
          customers_db (
            id,
            name,
            phone,
            email
          )
        `, { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (err) {
        console.error('[JobListReliable] Query error:', err);
        throw err;
      }

      if (!data) {
        throw new Error('No data returned from query');
      }

      console.log(`[JobListReliable] Loaded ${data.length} jobs successfully`);

      // Transform data to flatten customer details
      const transformedJobs = data.map((job: any) => ({
        id: job.id,
        job_number: job.job_number,
        created_at: job.created_at,
        status: job.status,
        grand_total: job.grand_total || 0,
        balance_due: job.balance_due || 0,
        customer_id: job.customer_id,
        customer_name: job.customers_db?.name || 'Unknown Customer',
        customer_phone: job.customers_db?.phone || '',
        customer_email: job.customers_db?.email || '',
        machine_category: job.machine_category,
        machine_brand: job.machine_brand,
        machine_model: job.machine_model,
        problem_description: job.problem_description,
      }));

      setJobs(transformedJobs);
      setRetryCount(0);

      if (transformedJobs.length === 0) {
        toast({
          title: 'No Jobs Found',
          description: 'There are no jobs in the system yet.',
        });
      }

    } catch (error: any) {
      console.error('[JobListReliable] Load error:', error);
      
      if (retryCount < MAX_RETRIES) {
        setError(`Loading failed. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          loadJobs();
        }, 2000 * (retryCount + 1));
      } else {
        setError(error.message || 'Failed to load jobs after multiple attempts');
        toast({
          title: 'Error Loading Jobs',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error && retryCount >= MAX_RETRIES) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            onClick={() => {
              setRetryCount(0);
              loadJobs();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No jobs found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Jobs ({jobs.length})</h2>
        <Button onClick={loadJobs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && retryCount < MAX_RETRIES && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">Job #</th>
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Customer</th>
              <th className="p-3 text-left font-medium">Machine</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-right font-medium">Total</th>
              <th className="p-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{job.job_number}</td>
                <td className="p-3">
                  {new Date(job.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div>{job.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{job.customer_phone}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    {job.machine_category && (
                      <div>{job.machine_category}</div>
                    )}
                    {job.machine_brand && job.machine_model && (
                      <div className="text-muted-foreground">
                        {job.machine_brand} {job.machine_model}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-3 text-right font-medium">
                  ${job.grand_total.toFixed(2)}
                </td>
                <td className="p-3 text-right font-medium">
                  ${job.balance_due.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
