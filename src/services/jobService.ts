import { supabase } from '@/integrations/supabase/client';

/**
 * CRITICAL: Always use the 'id' field (UUID), not 'job_number' (TEXT)
 * job_number is for display only (e.g., "JB2025-0071")
 * id is the actual database identifier
 */

export async function getJobById(jobId: string) {
  const { data, error } = await supabase
    .from('jobs_db')
    .select(`
      id,
      job_number,
      status,
      version,
      customer_id,
      grand_total,
      balance_due,
      created_at,
      updated_at,
      machine_category,
      machine_brand,
      machine_model,
      problem_description
    `)
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

export async function getJobByNumber(jobNumber: string) {
  const { data, error } = await supabase
    .from('jobs_db')
    .select('id, job_number, status, version')
    .eq('job_number', jobNumber)
    .single();

  if (error) throw error;
  return data;
}

export async function updateJobStatus(jobId: string, newStatus: string, currentVersion: number) {
  // @ts-ignore - Bypass deep type instantiation issue
  const result = await supabase
    .from('jobs_db')
    .update({
      status: newStatus,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('version', currentVersion);
  
  const { data, error } = result;

  if (error) {
    if (error.code === '22P02') {
      throw new Error('Invalid job ID. Please refresh and try again.');
    }
    if (error.code === 'PGRST116') {
      throw new Error('Job was updated by another user. Please refresh to see latest changes.');
    }
    throw error;
  }

  return data;
}

export async function getCustomerJobs(customerId: string) {
  const { data, error } = await supabase
    .from('jobs_db')
    .select(`
      id,
      job_number,
      status,
      grand_total,
      balance_due,
      created_at
    `)
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs_db')
    .select(`
      id,
      job_number,
      status,
      grand_total,
      balance_due,
      created_at,
      updated_at,
      version,
      customer_id,
      machine_category,
      machine_brand,
      machine_model,
      problem_description
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}
