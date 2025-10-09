// Service Reminder Scheduler
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';
import { addMonths } from 'date-fns';

/**
 * Schedule a service reminder when a job is marked as delivered
 * Commercial customers: 3 months
 * Domestic customers: 11 months
 */
export async function scheduleServiceReminder(job: Job): Promise<void> {
  // Only schedule if job is delivered and has customer type
  if (job.status !== 'delivered' || !job.customerType) {
    console.log('Job not eligible for reminder scheduling:', { status: job.status, customerType: job.customerType });
    return;
  }

  try {
    // Check if a future reminder already exists for this machine
    const machineKey = `${job.machineBrand}-${job.machineModel}-${job.machineSerial || 'no-serial'}`;
    const { data: existingReminders } = await supabase
      .from('service_reminders')
      .select('id')
      .eq('customer_id', job.customerId)
      .eq('machine_category', job.machineCategory)
      .eq('machine_brand', job.machineBrand)
      .eq('machine_model', job.machineModel)
      .eq('status', 'pending')
      .gte('reminder_date', new Date().toISOString());

    if (existingReminders && existingReminders.length > 0) {
      console.log('Reminder already scheduled for this machine');
      return;
    }

    // Calculate reminder date based on customer type
    const monthsToAdd = job.customerType === 'commercial' ? 3 : 11;
    const reminderDate = addMonths(job.deliveredAt || new Date(), monthsToAdd);

    // Create reminder
    const { error } = await supabase
      .from('service_reminders')
      .insert({
        customer_id: job.customerId,
        job_id: job.id,
        machine_category: job.machineCategory,
        machine_brand: job.machineBrand,
        machine_model: job.machineModel,
        machine_serial: job.machineSerial,
        reminder_type: 'service_due',
        reminder_date: reminderDate.toISOString().split('T')[0], // date only
        status: 'pending',
        contact_email: job.customer.email,
        contact_phone: job.customer.phone,
        message: `Service reminder for your ${job.machineBrand} ${job.machineModel}`,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Error scheduling service reminder:', error);
      throw error;
    }

    console.log(`Service reminder scheduled for ${reminderDate.toISOString()} (${job.customerType}, +${monthsToAdd} months)`);
  } catch (error) {
    console.error('Failed to schedule service reminder:', error);
    // Don't throw - we don't want to block job save if reminder scheduling fails
  }
}

/**
 * Cancel future reminders for a machine when marked as write-off
 */
export async function cancelMachineReminders(
  customerId: string,
  machineCategory: string,
  machineBrand: string,
  machineModel: string,
  machineSerial?: string
): Promise<void> {
  try {
    const query = supabase
      .from('service_reminders')
      .update({ status: 'cancelled', error_message: 'Machine marked as write-off' })
      .eq('customer_id', customerId)
      .eq('machine_category', machineCategory)
      .eq('machine_brand', machineBrand)
      .eq('machine_model', machineModel)
      .eq('status', 'pending')
      .gte('reminder_date', new Date().toISOString());

    if (machineSerial) {
      query.eq('machine_serial', machineSerial);
    }

    const { error } = await query;

    if (error) {
      console.error('Error cancelling machine reminders:', error);
    }
  } catch (error) {
    console.error('Failed to cancel machine reminders:', error);
  }
}
