import { supabase } from './supabase';
import type { JobListRow } from './types';

export async function getJobsListSimple(params?: {
  limit?: number;
  offset?: number;
  search?: string | null;
  status?: string | null;
}): Promise<JobListRow[]> {
  const { data, error } = await supabase.rpc('get_jobs_list_simple', {
    p_limit: Number(params?.limit ?? 25),
    p_offset: Number(params?.offset ?? 0),
    p_search: params?.search ?? null,
    p_status: params?.status ?? null
  });
  
  if (error) throw error;
  return (data ?? []) as JobListRow[];
}

export async function getJobDetailSimple(jobId: string) {
  const { data, error } = await supabase.rpc('get_job_detail_simple', { p_job_id: jobId });
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
export async function updateJobStatus(jobId: string, status: string) {
  const { data, error } = await supabase.rpc('update_job_status', {
    p_job_id: jobId,
    p_status: status
  });
  if (error) throw error;
  return data;
}

export async function updateJobTotals(jobId: string) {
  const { data, error } = await supabase.rpc('recalc_job_totals', {
    p_job_id: jobId
  });
  if (error) throw error;
  return data;
}

// Parts mutations
export async function addJobPart(jobId: string, part: { 
  sku: string; 
  desc: string; 
  qty: number; 
  unit_price: number;
  part_id?: string | null; // Optional catalogue part ID
}) {
  const { data, error } = await supabase.rpc('add_job_part', {
    p_job_id: jobId,
    p_sku: part.sku,
    p_desc: part.desc,
    p_qty: part.qty,
    p_unit_price: part.unit_price,
    p_part_id: part.part_id || null, // Pass NULL for custom parts
  });
  if (error) throw error;
  return data;
}

export async function updateJobPart(partId: string, part: { 
  sku: string; 
  desc: string; 
  qty: number; 
  unit_price: number;
}) {
  const { data, error } = await supabase.rpc('update_job_part', {
    p_part_id: partId,
    p_sku: part.sku,
    p_desc: part.desc,
    p_qty: part.qty,
    p_unit_price: part.unit_price,
  });
  if (error) throw error;
  return data;
}

export async function deleteJobPart(partId: string) {
  const { data, error } = await supabase.rpc('delete_job_part', { 
    p_part_id: partId 
  });
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
