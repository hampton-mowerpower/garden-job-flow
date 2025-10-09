// Account Customer Sync Utilities
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';

/**
 * Auto-save job and costs to Account Customer history
 * Called after job save when customer is an Account Customer
 */
export async function syncJobToAccountCustomer(job: Job): Promise<void> {
  if (!job.accountCustomerId) {
    console.log('Job is not linked to an account customer, skipping sync');
    return;
  }

  try {
    // Calculate breakdown summary
    const breakdown = {
      parts: job.partsSubtotal,
      labour: job.labourTotal,
      transport: job.transportTotalCharge || 0,
      sharpen: job.sharpenTotalCharge || 0,
      smallRepair: job.smallRepairTotal || 0,
      subtotal: job.subtotal,
      gst: job.gst,
      grandTotal: job.grandTotal,
      deposit: job.serviceDeposit || 0,
      balance: job.balanceDue || job.grandTotal
    };

    // Create summary text
    const summary = `Job ${job.jobNumber} - ${job.machineBrand} ${job.machineModel}`;

    // Insert into account customer history
    const { error: historyError } = await supabase
      .from('account_customer_history')
      .insert({
        account_customer_id: job.accountCustomerId,
        kind: 'job_cost',
        ref_id: job.id,
        summary: summary,
        amount: job.grandTotal,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (historyError) {
      console.error('Error syncing job to account history:', historyError);
      throw historyError;
    }

    console.log(`Job ${job.jobNumber} synced to account customer history`);
  } catch (error) {
    console.error('Failed to sync job to account customer:', error);
    // Don't throw - we don't want to block job save if history sync fails
  }
}

/**
 * Log email send to account customer
 */
export async function logAccountCustomerEmail(
  accountCustomerId: string,
  jobId: string,
  messageType: string,
  payload: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('account_customer_messages')
      .insert({
        account_customer_id: accountCustomerId,
        message_type: messageType,
        payload: payload,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging account customer email:', error);
    }
  } catch (error) {
    console.error('Failed to log account customer email:', error);
  }
}
