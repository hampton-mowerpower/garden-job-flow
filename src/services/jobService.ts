import { supabase } from '@/integrations/supabase/client';

/**
 * CRITICAL: Keep it simple. No version checks, no optimistic locking.
 * Basic CRUD operations only.
 */

export async function getAllJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select(`
        id,
        job_number,
        status,
        customer_id,
        grand_total,
        balance_due,
        created_at,
        machine_category,
        machine_brand,
        machine_model,
        machine_serial,
        problem_description,
        customers_db(id, name, phone, email)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Job load error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getAllJobs failed:', error);
    return [];
  }
}

export async function getJobById(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs_db')
      .select(`
        *,
        customers_db(id, name, phone, email),
        job_parts(id, description, quantity, unit_price, total_price)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('getJobById failed:', error);
    return null;
  }
}

export async function updateJobStatus(jobId: string, newStatus: string) {
  try {
    console.log('Updating job status:', { jobId, newStatus });
    
    // Simple direct update - NO version checking
    const { error } = await supabase
      .from('jobs_db')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    console.log('Status updated successfully');
    return true;
  } catch (error) {
    console.error('updateJobStatus failed:', error);
    throw error;
  }
}

export async function getCustomerJobs(customerId: string) {
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

export async function getJobByNumber(jobNumber: string) {
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
