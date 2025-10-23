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

  const getCategoryByName = (name: string | null | undefined): Category | undefined => {
    if (!name) return undefined;
    return categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  };

  const getLabourRate = (categoryName: string | null | undefined): number => {
    if (!categoryName) return 95; // Default fallback
    const category = getCategoryByName(categoryName);
    return category?.rate_default || 95; // Default fallback
  };

  const ensureCategoryExists = async (
    categoryName: string | null | undefined, 
    labourRate?: number
  ): Promise<Category | null> => {
    try {
      if (!categoryName) return null;
      
      // Check if category exists (case-insensitive)
      const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
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

  const updateCategoryRateByName = async (
    categoryName: string | null | undefined,
    newRate: number
  ): Promise<boolean> => {
    try {
      if (!categoryName) return false;
      
      // Find the category case-insensitively first
      const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!category) {
        console.error('Category not found:', categoryName);
        return false;
      }

      const { error } = await supabase
        .from('categories')
        .update({ rate_default: newRate })
        .eq('id', category.id);

      if (error) throw error;

      await loadCategories();
      return true;
    } catch (err: any) {
      console.error('Error updating category rate by name:', err);
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
    updateCategoryRateByName,
    refetch: loadCategories
  };
};
