import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';

/**
 * Fallback hook that uses direct database functions when REST API is down
 * This bypasses PostgREST and queries the database directly via RPC functions
 * Uses the RECOVERY_SAFE.sql functions (no aggregates, no SQL errors)
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
        console.log('🔄 Using fallback: get_jobs_direct RPC');
        
        // Use the safe direct query function (RECOVERY_SAFE.sql)
        const { data, error: rpcError } = await supabase.rpc('get_jobs_direct' as any, {
          p_limit: limit,
          p_offset: offset
        });

        if (rpcError) {
          console.error('❌ Fallback RPC failed:', rpcError);
          
          // Check if it's a "function does not exist" error
          if (rpcError.message?.includes('does not exist') || rpcError.code === '42883') {
            setError('RECOVERY_SAFE.sql not run yet. Admin must run it in Supabase SQL Editor.');
          } else {
            setError(rpcError.message || 'Fallback query failed');
          }
          return;
        }

        console.log(`✅ Fallback loaded ${data?.length || 0} jobs`);

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
        console.error('❌ Direct query failed:', err);
        setError(err.message || 'Failed to fetch jobs via direct query');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobsDirect();
  }, [limit, offset, enabled]);

  return { jobs, isLoading, error };
}
