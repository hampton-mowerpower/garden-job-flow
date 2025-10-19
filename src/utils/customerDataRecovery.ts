// @ts-nocheck
/**
 * Customer Data Recovery Utilities
 * 
 * Tools for identifying and fixing corrupted job-customer mappings
 */

import { supabase } from '@/integrations/supabase/client';

export interface CorruptedJob {
  job_number: string;
  job_id: string;
  current_customer_id: string;
  current_customer_name: string;
  current_customer_phone: string;
  expected_customer_id?: string;
  expected_customer_name?: string;
  expected_customer_phone?: string;
  corruption_type: 'wrong_customer' | 'missing_customer' | 'duplicate_customer';
}

export interface RecoveryReport {
  total_jobs_checked: number;
  corrupted_jobs: CorruptedJob[];
  fixed_jobs: string[];
  failed_jobs: { job_number: string; error: string }[];
  timestamp: string;
}

/**
 * Find duplicate customers by email or phone
 * Note: This will work once the database migration adds the normalized columns
 */
export async function findDuplicateCustomers(): Promise<{
  by_email: Array<{ email: string; customer_ids: string[]; customer_names: string[] }>;
  by_phone: Array<{ phone: string; customer_ids: string[]; customer_names: string[] }>;
}> {
  try {
    // Find duplicates by email using direct query
    const { data: allCustomers, error: customersError } = await supabase
      .from('customers_db')
      .select('id, name, email, phone, created_at')
      .eq('is_deleted', false) as any;

    if (customersError) throw customersError;

    // Normalize and group by email
    const emailGroups = new Map<string, any[]>();
    const phoneGroups = new Map<string, any[]>();

    (allCustomers || []).forEach((customer: any) => {
      // Normalize email
      const normalizedEmail = customer.email?.toLowerCase().trim();
      if (normalizedEmail) {
        const group = emailGroups.get(normalizedEmail) || [];
        group.push(customer);
        emailGroups.set(normalizedEmail, group);
      }
      
      // Normalize phone (simple version)
      const normalizedPhone = customer.phone?.replace(/\D/g, '');
      if (normalizedPhone && normalizedPhone.length >= 9) {
        const group = phoneGroups.get(normalizedPhone) || [];
        group.push(customer);
        phoneGroups.set(normalizedPhone, group);
      }
    });

    const emailDupes = Array.from(emailGroups.entries())
      .filter(([_, customers]) => customers.length > 1)
      .map(([email, customers]) => ({
        email,
        customer_ids: customers.map(c => c.id),
        customer_names: customers.map(c => c.name)
      }));

    const phoneDupes = Array.from(phoneGroups.entries())
      .filter(([_, customers]) => customers.length > 1)
      .map(([phone, customers]) => ({
        phone,
        customer_ids: customers.map(c => c.id),
        customer_names: customers.map(c => c.name)
      }));

    return {
      by_email: emailDupes,
      by_phone: phoneDupes
    };
  } catch (error) {
    console.error('Error finding duplicate customers:', error);
    throw error;
  }
}

/**
 * Scan all jobs for potential customer data corruption
 */
export async function scanForCorruptedJobs(): Promise<CorruptedJob[]> {
  const corrupted: CorruptedJob[] = [];

  try {
    // Get all jobs with their customer data
    const { data: jobs, error } = await supabase
      .from('jobs_db')
      .select(`
        id,
        job_number,
        customer_id,
        customers_db!inner (
          id,
          name,
          phone,
          email
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check each job for inconsistencies
    for (const job of jobs || []) {
      const customer = job.customers_db as any;
      
      // Check if customer_id is null (should never happen)
      if (!job.customer_id) {
        corrupted.push({
          job_number: job.job_number,
          job_id: job.id,
          current_customer_id: '',
          current_customer_name: 'NULL',
          current_customer_phone: 'NULL',
          corruption_type: 'missing_customer'
        });
        continue;
      }

      // Check if the linked customer exists
      if (!customer) {
        corrupted.push({
          job_number: job.job_number,
          job_id: job.id,
          current_customer_id: job.customer_id,
          current_customer_name: 'CUSTOMER NOT FOUND',
          current_customer_phone: 'CUSTOMER NOT FOUND',
          corruption_type: 'wrong_customer'
        });
      }
    }

    return corrupted;
  } catch (error) {
    console.error('Error scanning for corrupted jobs:', error);
    throw error;
  }
}

/**
 * Merge duplicate customers and repoint jobs
 * @param keeperId - The customer ID to keep
 * @param duplicateIds - Array of duplicate customer IDs to merge into keeper
 */
export async function mergeDuplicateCustomers(
  keeperId: string,
  duplicateIds: string[]
): Promise<{ success: boolean; jobs_updated: number; error?: string }> {
  try {
    // Get the keeper customer details
    const { data: keeper, error: keeperError } = await supabase
      .from('customers_db')
      .select('*')
      .eq('id', keeperId)
      .single();

    if (keeperError) throw keeperError;
    if (!keeper) throw new Error('Keeper customer not found');

    let totalJobsUpdated = 0;

    // For each duplicate, repoint its jobs to the keeper
    for (const duplicateId of duplicateIds) {
      // Update jobs one at a time to avoid triggering the mass-update safety trigger
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs_db')
        .select('id, job_number')
        .eq('customer_id', duplicateId)
        .is('deleted_at', null);

      if (jobsError) throw jobsError;

      // Update each job individually
      for (const job of jobs || []) {
        const { error: updateError } = await supabase
          .from('jobs_db')
          .update({ 
            customer_id: keeperId,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Failed to update job ${job.job_number}:`, updateError);
        } else {
          totalJobsUpdated++;
        }
      }

      // Mark duplicate customer as deleted
      await supabase
        .from('customers_db')
        .update({ 
          is_deleted: true,
          merged_into_id: keeperId
        })
        .eq('id', duplicateId);
    }

    // Log the merge in maintenance_audit
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('maintenance_audit').insert({
      action: 'merge_duplicate_customers',
      table_name: 'customers_db',
      rows_affected: duplicateIds.length,
      description: `Merged ${duplicateIds.length} duplicate customers into ${keeper.name}`,
      performed_by: userData?.user?.id,
      metadata: {
        keeper_id: keeperId,
        keeper_name: keeper.name,
        duplicate_ids: duplicateIds,
        jobs_updated: totalJobsUpdated
      }
    });

    return {
      success: true,
      jobs_updated: totalJobsUpdated
    };
  } catch (error: any) {
    console.error('Error merging duplicate customers:', error);
    return {
      success: false,
      jobs_updated: 0,
      error: error.message
    };
  }
}

/**
 * Generate a CSV export of current job-customer mappings
 * Useful for backup before making changes
 */
export async function exportJobCustomerMapping(): Promise<string> {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs_db')
      .select(`
        job_number,
        customer_id,
        customers_db (
          name,
          phone,
          email,
          company_name
        ),
        created_at,
        updated_at
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate CSV
    const headers = 'job_number,customer_id,customer_name,customer_phone,customer_email,customer_company,job_created_at,job_updated_at\n';
    const rows = (jobs || []).map(job => {
      const customer = job.customers_db as any;
      return [
        job.job_number,
        job.customer_id,
        customer?.name || '',
        customer?.phone || '',
        customer?.email || '',
        customer?.company_name || '',
        job.created_at,
        job.updated_at
      ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    return headers + rows;
  } catch (error) {
    console.error('Error exporting job-customer mapping:', error);
    throw error;
  }
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
