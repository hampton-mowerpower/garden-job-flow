import { supabase } from './supabase';
import type { JobListRow } from './types';

export async function getJobsListSimple(params?: {
  limit?: number;
  offset?: number;
  search?: string | null;
  status?: string | null;
}): Promise<JobListRow[]> {
  // Use direct query to get subtotal field (RPC doesn't return it)
  let query = supabase
    .from('jobs_db')
    .select(`
      id,
      job_number,
      status,
      created_at,
      updated_at,
      subtotal,
      grand_total,
      balance_due,
      customer_id,
      machine_category,
      machine_brand,
      machine_model,
      machine_serial,
      problem_description,
      customers_db!inner(
        name,
        phone,
        email
      )
    `)
    .is('deleted_at', null);
  
  // Apply search filter
  if (params?.search && params.search.trim()) {
    const searchTerm = `%${params.search.trim()}%`;
    query = query.or(`job_number.ilike.${searchTerm},machine_model.ilike.${searchTerm},machine_serial.ilike.${searchTerm},machine_brand.ilike.${searchTerm},machine_category.ilike.${searchTerm},problem_description.ilike.${searchTerm},customers_db.name.ilike.${searchTerm},customers_db.phone.ilike.${searchTerm}`);
  }
  
  // Apply status filter
  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  
  query = query
    .order('created_at', { ascending: false })
    .limit(params?.limit ?? 25);
  
  if (params?.offset) {
    query.range(params.offset, params.offset + (params.limit ?? 25) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform to JobListRow format
  return (data || []).map((row: any) => ({
    id: row.id,
    job_number: row.job_number,
    status: row.status,
    job_created_at: row.created_at,
    job_updated_at: row.updated_at,
    subtotal: row.subtotal,
    grand_total: row.grand_total,
    balance_due: row.balance_due,
    customer_id: row.customer_id,
    customer_name: row.customers_db?.name || null,
    customer_phone: row.customers_db?.phone || null,
    customer_email: row.customers_db?.email || null,
    machine_category: row.machine_category,
    machine_brand: row.machine_brand,
    machine_model: row.machine_model,
    machine_serial: row.machine_serial,
    problem_description: row.problem_description,
    latest_note_text: null,
    latest_note_at: null,
  })) as JobListRow[];
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

// Customer mutations (RPC-only)
export async function upsertCustomer(payload: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  company_name?: string;
  customer_type?: string;
}) {
  const { data, error } = await supabase.rpc('upsert_customer_rpc', {
    p_id: payload.id || null,
    p_name: payload.name,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_address: payload.address || null,
    p_suburb: payload.suburb || null,
    p_postcode: payload.postcode || null,
    p_company_name: payload.company_name || null,
    p_customer_type: payload.customer_type || 'domestic',
  });
  
  if (error) throw error;
  return data;
}

export async function deleteCustomer(customerId: string) {
  const { data, error } = await supabase.rpc('delete_customer_rpc', {
    p_customer_id: customerId
  });
  if (error) throw error;
  return data;
}

export async function searchCustomers(search: string = '', limit: number = 50) {
  const { data, error } = await supabase.rpc('search_customers_rpc', {
    p_search: search,
    p_limit: limit
  });
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

// Notes (RPC-only)
export async function getJobNotes(jobId: string) {
  const { data, error } = await supabase.rpc('get_job_notes', {
    p_job_id: jobId
  });
  if (error) throw error;
  return data;
}

export async function addJobNote(jobId: string, noteText: string, userId: string) {
  const { data, error } = await supabase.rpc('add_job_note_rpc', {
    p_job_id: jobId,
    p_note_text: noteText,
    p_user_id: userId
  });
  if (error) throw error;
  return data;
}

// Parts Catalogue (RPC-only)
export async function getPartsCatalogue(params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc('get_parts_catalogue_rpc', {
    p_category: params?.category || null,
    p_search: params?.search || '',
    p_limit: params?.limit || 100,
    p_offset: params?.offset || 0
  });
  if (error) throw error;
  return data;
}

export async function upsertPartCatalogue(part: {
  id?: string;
  name: string;
  sku: string;
  category: string;
  sell_price: number;
  cost_price?: number;
  stock_qty?: number;
  description?: string;
  active?: boolean;
}) {
  const { data, error } = await supabase.rpc('upsert_part_catalogue_rpc', {
    p_id: part.id || null,
    p_name: part.name,
    p_sku: part.sku,
    p_category: part.category,
    p_sell_price: part.sell_price,
    p_cost_price: part.cost_price || null,
    p_stock_qty: part.stock_qty || null,
    p_description: part.description || null,
    p_active: part.active ?? true
  });
  if (error) throw error;
  return data;
}

export async function deletePartCatalogue(partId: string) {
  const { data, error } = await supabase.rpc('delete_part_catalogue_rpc', {
    p_part_id: partId
  });
  if (error) throw error;
  return data;
}
