import { useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { JobSalesItem } from '@/types/job';
import { useToast } from './use-toast';

interface UseUnpaidSalesAutosaveProps {
  jobId?: string;
  customerId: string;
  salesItems: JobSalesItem[];
  enabled?: boolean;
}

export function useUnpaidSalesAutosave({
  jobId,
  customerId,
  salesItems,
  enabled = true
}: UseUnpaidSalesAutosaveProps) {
  const { toast } = useToast();
  const [debouncedSalesItems] = useDebounce(salesItems, 400);
  const previousSalesRef = useRef<string>('');
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !jobId || !customerId || isSavingRef.current) return;

    const currentSalesString = JSON.stringify(debouncedSalesItems);
    
    // Skip if data hasn't changed
    if (currentSalesString === previousSalesRef.current) return;

    const saveSales = async () => {
      isSavingRef.current = true;
      try {
        // Delete existing sales items for this job
        await supabase
          .from('job_sales_items')
          .delete()
          .eq('job_id', jobId);

        // Insert new sales items
        if (debouncedSalesItems.length > 0) {
          const itemsToInsert = debouncedSalesItems.map(item => ({
            job_id: jobId,
            customer_id: customerId,
            description: item.description,
            category: item.category,
            amount: item.amount,
            notes: item.notes || null,
            collect_with_job: item.collect_with_job,
            paid_status: item.paid_status || 'unpaid'
          }));

          const { error } = await supabase
            .from('job_sales_items')
            .insert(itemsToInsert);

          if (error) throw error;
        }

        previousSalesRef.current = currentSalesString;
      } catch (error) {
        console.error('Auto-save failed for unpaid sales:', error);
        toast({
          title: 'Auto-save failed',
          description: 'Failed to save unpaid sales. Please try again.',
          variant: 'destructive'
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    saveSales();
  }, [debouncedSalesItems, jobId, customerId, enabled, toast]);

  return { isSaving: isSavingRef.current };
}
