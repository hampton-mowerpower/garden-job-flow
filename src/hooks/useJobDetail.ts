import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHealthStore } from '@/lib/health';

export interface JobDetail {
  id: string;
  job_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string;
  grand_total: number;
  balance_due: number;
  subtotal: number;
  gst: number;
  parts_subtotal: number;
  labour_total: number;
  labour_hours: number;
  labour_rate: number;
  machine_category: string;
  machine_brand: string;
  machine_model: string;
  machine_serial: string;
  problem_description: string;
  service_performed: string;
  recommendations: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  version?: number;
}

async function fetchJobDetailRest(id: string): Promise<JobDetail> {
  const { data, error } = await supabase.rpc('get_job_detail_simple', {
    p_job_id: id,
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Job not found');

  return data[0];
}

async function fetchJobDetailEdge(id: string): Promise<JobDetail> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `https://kyiuojjaownbvouffqbm.supabase.co/functions/v1/ef_read_job_detail`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ id }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Job not found');
    }
    throw new Error(`Edge function failed: ${response.statusText}`);
  }

  return await response.json();
}

export function useJobDetail(id: string | undefined) {
  const { apiMode } = useHealthStore();

  return useQuery({
    queryKey: ['job-detail', id, apiMode],
    queryFn: async () => {
      if (!id) throw new Error('Job ID required');
      
      if (apiMode === 'rest') {
        return await fetchJobDetailRest(id);
      } else {
        return await fetchJobDetailEdge(id);
      }
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error.message === 'Job not found') return false;
      return failureCount < 5;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
