import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';

/**
 * Fallback hook that uses direct database functions when REST API is down
 * This bypasses PostgREST and queries the database directly via RPC functions
 */
export function useJobsDirectFallback(
  limit: number = 25,
  offset: number = 0,
  enabled: boolean = false
) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchJobsDirect = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the direct query function that bypasses PostgREST REST API
        const { data, error: rpcError } = await supabase.rpc('get_jobs_direct' as any, {
          p_limit: limit,
          p_offset: offset
        });

        if (rpcError) {
          throw rpcError;
        }

        // Parse and convert to Job type - data is now an array of rows from TABLE return
        const rawJobs = data as any[];
        const convertedJobs: Job[] = (rawJobs || []).map(item => ({
          id: item.id,
          jobNumber: item.job_number,
          status: item.status,
          createdAt: item.created_at,
          grandTotal: item.grand_total,
          balanceDue: item.balance_due,
          machineCategory: item.machine_category,
          machineBrand: item.machine_brand,
          machineModel: item.machine_model,
          machineSerial: item.machine_serial,
          problemDescription: item.problem_description,
          customerId: item.customer_id || '',
          customer: {
            id: item.customer_id || '',
            name: item.customer_name || 'Unknown',
            phone: item.customer_phone || '',
            email: item.customer_email || ''
          }
        } as Job));
        setJobs(convertedJobs);
      } catch (err: any) {
        console.error('Direct query failed:', err);
        setError(err.message || 'Failed to fetch jobs via direct query');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobsDirect();
  }, [limit, offset, enabled]);

  return { jobs, isLoading, error };
}
