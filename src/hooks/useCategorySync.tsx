import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to ensure categories are synced between Booking and Admin
 * Reconciles local and database categories on mount
 */
export const useCategorySync = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const reconcileCategories = async () => {
    try {
      setSyncing(true);

      // Get all active categories from database
      const { data: dbCategories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;

      console.log('Categories reconciled:', dbCategories?.length || 0);
      
      return dbCategories || [];
    } catch (error: any) {
      console.error('Error reconciling categories:', error);
      toast({
        title: 'Sync Warning',
        description: 'Could not sync categories. Please refresh.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setSyncing(false);
    }
  };

  const ensureCategoryExists = async (categoryName: string, labourRate: number = 95) => {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('active', true)
        .single();

      if (existing) return existing.id;

      // Create new category
      const { data: maxOrder } = await supabase
        .from('categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          rate_default: labourRate,
          display_order: (maxOrder?.display_order || 0) + 1,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Category Created',
        description: `"${categoryName}" synced to Admin`
      });

      // Preload common parts for new category
      try {
        const { preloadCommonParts } = await import('@/utils/csvImport');
        await preloadCommonParts(categoryName);
      } catch (err) {
        console.error('Error preloading parts:', err);
      }

      return data.id;
    } catch (error: any) {
      console.error('Error ensuring category exists:', error);
      return null;
    }
  };

  return {
    reconcileCategories,
    ensureCategoryExists,
    syncing
  };
};
