import { supabase } from './supabase';
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
  const { data, error } = await supabase.rpc('get_job_detail_simple', { p_job_id: id });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getJobStatsEfficient() {
  // Temporarily disabled - use simple count
  const { count } = await supabase
    .from('jobs_db')
    .select('*', { count: 'exact', head: true });
  
  return {
    total_jobs: count || 0,
    today: 0,
    this_week: 0,
    this_month: 0,
    this_year: 0,
    open: 0,
    parts: 0,
    quotes: 0,
    completed: 0,
    delivered: 0,
    write_off: 0
  };
}

export async function apiHealth() {
  // Disabled during maintenance
  return { ok: true, timestamp: new Date().toISOString() };
}

// Job mutations
export async function updateJobStatus(id: string, status: string) {
  const { data, error } = await supabase.rpc('update_job_status', {
    p_job_id: id,
    p_status: status
  });
  if (error) throw error;
  return data;
}

export async function updateJobTotals(id: string, fields: any) {
  // Just trigger recalc - server handles totals
  const { data, error } = await supabase.rpc('recalc_job_totals', {
    p_job_id: id
  });
  if (error) throw error;
  
  // Refetch the updated job
  const job = await supabase
    .from('jobs_db')
    .select('id, grand_total, balance_due, subtotal, gst, labour_total, parts_subtotal')
    .eq('id', id)
    .single();
  
  return job.data;
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
  const { data, error } = await supabase
    .from('customers_db')
    .upsert(payload)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function attachCustomerToJob(jobId: string, customerId: string) {
  const { data, error } = await supabase
    .from('jobs_db')
    .update({ customer_id: customerId })
    .eq('id', jobId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Notes
export async function addJobNote(jobId: string, noteText: string, userId: string) {
  const { data, error } = await supabase
    .from('job_notes')
    .insert({
      job_id: jobId,
      note_text: noteText,
      user_id: userId,
      visibility: 'internal'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
