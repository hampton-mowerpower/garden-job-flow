import { supabase } from '@/integrations/supabase/client';

/**
 * One-time cleanup utility to merge Barry Rickards duplicates
 * Run this from the browser console: import('./utils/cleanupBarryDuplicates').then(m => m.cleanupBarryDuplicates())
 */
export async function cleanupBarryDuplicates() {
  try {
    console.log('Starting Barry Rickards cleanup...');

    // 1. Find all Barry records
    const { data: barryRecords, error: fetchError } = await supabase
      .from('customers_db')
      .select('*')
      .or('phone.eq.0418356019,email.eq.barry.rickards1@gmail.com')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!barryRecords || barryRecords.length === 0) {
      console.log('No Barry records found');
      return;
    }

    console.log(`Found ${barryRecords.length} Barry records`);

    // 2. Choose the oldest as master (or the one with the most correct name)
    const master = barryRecords.find(r => r.name === 'Barry Rickards') || barryRecords[0];
    const duplicates = barryRecords.filter(r => r.id !== master.id);

    console.log(`Master: ${master.name} (${master.id})`);
    console.log(`Duplicates to merge: ${duplicates.length}`);

    // 3. Get user for audit
    const { data: { user } } = await supabase.auth.getUser();

    // 4. Merge each duplicate
    for (const dup of duplicates) {
      console.log(`Merging ${dup.name} (${dup.id})...`);

      // Repoint jobs safely (with mass update bypass)
      const { data: jobsToUpdate } = await supabase
        .from('jobs_db')
        .select('id')
        .eq('customer_id', dup.id);
      
      if (jobsToUpdate && jobsToUpdate.length > 0) {
        // Update jobs directly (acceptable for one-time cleanup script)
        await supabase
          .from('jobs_db')
          .update({ customer_id: master.id })
          .eq('customer_id', dup.id);
      }
      
      // Update other tables
      const otherUpdates = [
        supabase.from('invoices').update({ customer_id: master.id }).eq('customer_id', dup.id),
        supabase.from('service_reminders').update({ customer_id: master.id }).eq('customer_id', dup.id)
      ];
      
      await Promise.all(otherUpdates);

      // Mark as deleted and merged
      await supabase
        .from('customers_db')
        .update({
          is_deleted: true,
          merged_into_id: master.id
        })
        .eq('id', dup.id);

      // Create audit log
      await supabase
        .from('customer_audit')
        .insert({
          customer_id: dup.id,
          action: 'merged',
          details: {
            merged_into: master.id,
            old_name: dup.name,
            old_data: dup
          },
          created_by: user?.id
        });

      console.log(`✓ Merged ${dup.name}`);
    }

    // 5. Update master name to correct spelling if needed
    if (master.name !== 'Barry Rickards') {
      await supabase
        .from('customers_db')
        .update({ name: 'Barry Rickards' })
        .eq('id', master.id);
      
      console.log('✓ Updated master name to "Barry Rickards"');
    }

    console.log(`✅ Cleanup complete! Master ID: ${master.id}`);
    console.log('All history preserved under the master record.');

    return {
      success: true,
      masterId: master.id,
      mergedCount: duplicates.length
    };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}
