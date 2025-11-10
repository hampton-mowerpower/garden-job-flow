import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHealthStore } from '@/lib/health';

// Response structure from get_job_detail_simple RPC
export interface JobDetailResponse {
  job: {
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
    version?: number;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  parts: Array<{
    id: string;
    sku: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes: Array<{
    id: string;
    note_text: string;
    created_at: string;
    user_id: string;
  }>;
}

// Flat structure for easy consumption
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
  console.log('[useJobDetail] Fetching job via REST:', id);
  
  const { data, error } = await supabase.rpc('get_job_detail_simple', {
    p_job_id: id,
  });

  console.log('[useJobDetail] RPC response:', { data, error });

  if (error) {
    console.error('[useJobDetail] RPC error:', error);
    throw error;
  }
  
  if (!data) {
    console.error('[useJobDetail] No job data returned');
    throw new Error('Job not found');
  }

  // Type the response properly
  const response = data as JobDetailResponse;
  
  if (!response.job) {
    console.error('[useJobDetail] Invalid response structure');
    throw new Error('Invalid job data structure');
  }

  // Flatten the nested structure into JobDetail format
  const flattenedJob: JobDetail = {
    ...response.job,
    customer_name: response.customer?.name || '',
    customer_phone: response.customer?.phone || '',
    customer_email: response.customer?.email || '',
    customer_address: response.customer?.address || '',
  };

  console.log('[useJobDetail] Flattened job data:', flattenedJob);
  return flattenedJob;
}

async function fetchJobDetailEdge(id: string): Promise<JobDetail> {
  console.log('[useJobDetail] Fetching job via Edge Function:', id);
  
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

  console.log('[useJobDetail] Edge function response status:', response.status);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Job not found');
    }
    throw new Error(`Edge function failed: ${response.statusText}`);
  }

  const jobData = await response.json();
  console.log('[useJobDetail] Edge function returned:', jobData);
  
  return jobData;
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
