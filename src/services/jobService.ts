import { supabase } from '@/integrations/supabase/client';

/**
 * CRITICAL: Keep it simple. No version checks, no optimistic locking.
 * Basic CRUD operations only.
 */

export async function getAllJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load jobs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('getAllJobs failed:', error);
    return [];
  }
}

export async function getJobById(jobId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('getJobById failed:', error);
    return null;
  }
}

export async function updateJobStatus(jobId: string, newStatus: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('jobs_db')
      .update({ status: newStatus })
      .eq('id', jobId);
    
    if (error) {
      console.error('Failed to update job status:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('updateJobStatus failed:', error);
    throw error;
  }
}

export async function getCustomerJobs(customerId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select(`
        id,
        job_number,
        status,
        grand_total,
        balance_due,
        created_at,
        machine_category,
        machine_brand,
        machine_model
      `)
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('getCustomerJobs failed:', error);
    return [];
  }
}

export async function getJobByNumber(jobNumber: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('id, job_number, status')
      .eq('job_number', jobNumber)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('getJobByNumber failed:', error);
    return null;
  }
}
