import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  rate_default: number;
  display_order: number;
  active: boolean;
  is_transport_large?: boolean;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (fetchError) throw fetchError;

      setCategories(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();

    // Subscribe to category changes
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories' 
      }, () => {
        loadCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find(c => c.name === name);
  };

  const getLabourRate = (categoryName: string): number => {
    const category = getCategoryByName(categoryName);
    return category?.rate_default || 95; // Default fallback
  };

  const ensureCategoryExists = async (
    categoryName: string, 
    labourRate?: number
  ): Promise<Category | null> => {
    try {
      // Check if category exists
      const existing = categories.find(c => c.name === categoryName);
      if (existing) return existing;

      // Create new category
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          rate_default: labourRate || 95,
          display_order: maxOrder + 1,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh categories
      await loadCategories();
      
      return data;
    } catch (err: any) {
      console.error('Error ensuring category exists:', err);
      setError(err.message);
      return null;
    }
  };

  const updateCategoryRate = async (
    categoryId: string, 
    newRate: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ rate_default: newRate })
        .eq('id', categoryId);

      if (error) throw error;

      await loadCategories();
      return true;
    } catch (err: any) {
      console.error('Error updating category rate:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    categories,
    loading,
    error,
    getCategoryByName,
    getLabourRate,
    ensureCategoryExists,
    updateCategoryRate,
    refetch: loadCategories
  };
};
