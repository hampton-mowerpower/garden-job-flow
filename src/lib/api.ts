import { supabase } from './supabase';
import { withTimeout } from './withTimeout';
import type { JobListRow } from './types';

export async function getJobsListSimple(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}): Promise<JobListRow[]> {
  const { data, error } = await supabase.rpc('get_jobs_list_simple', {
    p_limit: params?.limit ?? 25,
    p_offset: params?.offset ?? 0,
    p_search: params?.search ?? null,
    p_status: params?.status ?? null
  });
  
  if (error) throw error;
  return (data ?? []) as JobListRow[];
}

export async function getJobDetailSimple(id: string) {
  const result = await withTimeout(
    (async () => {
      return await supabase.rpc('get_job_detail_simple', { p_job_id: id });
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getJobStatsEfficient() {
  const result = await withTimeout(
    (async () => {
      return await supabase.rpc('get_job_stats_efficient');
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}

export async function apiHealth() {
  const { data, error } = await supabase.rpc('api_health_check');
  if (error) throw error;
  return data;
}

// Job mutations
export async function updateJobStatus(id: string, status: string) {
  const result = await withTimeout(
    (async () => {
      return await supabase
        .from('jobs_db')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}

export async function updateJobTotals(
  id: string,
  fields: {
    grand_total?: number;
    balance_due?: number;
    subtotal?: number;
    gst?: number;
    labour_total?: number;
    parts_subtotal?: number;
  }
) {
  const result = await withTimeout(
    (async () => {
      return await supabase
        .from('jobs_db')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}

// Customer mutations
export async function upsertCustomer(payload: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_type?: string;
}) {
  const result = await withTimeout(
    (async () => {
      return await supabase
        .from('customers_db')
        .upsert(payload)
        .select()
        .single();
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}

export async function attachCustomerToJob(jobId: string, customerId: string) {
  const result = await withTimeout(
    (async () => {
      return await supabase
        .from('jobs_db')
        .update({ customer_id: customerId })
        .eq('id', jobId)
        .select()
        .single();
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}

// Notes
export async function addJobNote(jobId: string, noteText: string, userId: string) {
  const result = await withTimeout(
    (async () => {
      return await supabase
        .from('job_notes')
        .insert({
          job_id: jobId,
          note_text: noteText,
          user_id: userId,
          visibility: 'internal'
        })
        .select()
        .single();
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data;
}
