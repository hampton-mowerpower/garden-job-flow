import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHealthStore } from '@/lib/health';

export interface JobListItem {
  job_id: string;
  job_number: string;
  status: string;
  created_at: string;
  grand_total: number;
  balance_due: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  machine_category: string;
  machine_brand: string;
  machine_model: string;
  machine_serial: string;
  problem_description: string;
}

interface UseJobsListParams {
  limit?: number;
  offset?: number;
  status?: string | null;
}

async function fetchJobsRest(params: UseJobsListParams): Promise<JobListItem[]> {
  let query = supabase
    .from('v_jobs_list')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params.limit || 50);

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function fetchJobsEdge(params: UseJobsListParams): Promise<JobListItem[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `https://kyiuojjaownbvouffqbm.supabase.co/functions/v1/ef_read_jobs_list`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        limit: params.limit || 50,
        offset: params.offset || 0,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Edge function failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Apply status filter client-side for Edge fallback
  if (params.status) {
    return data.filter((job: JobListItem) => job.status === params.status);
  }
  
  return data;
}

export function useJobsList(params: UseJobsListParams = {}) {
  const { apiMode } = useHealthStore();

  return useQuery({
    queryKey: ['jobs-list', params, apiMode],
    queryFn: async () => {
      if (apiMode === 'rest') {
        return await fetchJobsRest(params);
      } else {
        return await fetchJobsEdge(params);
      }
    },
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
