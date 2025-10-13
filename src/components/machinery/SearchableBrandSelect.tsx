import React, { useState, useEffect } from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchableBrandSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categoryName?: string;
  disabled?: boolean;
}

export function SearchableBrandSelect({ value, onValueChange, categoryName, disabled }: SearchableBrandSelectProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryName) {
      setCategoryId(null);
      return;
    }

    const fetchCategoryId = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .eq('active', true)
        .maybeSingle();

      setCategoryId(data?.id || null);
    };

    fetchCategoryId();
  }, [categoryName]);

  const searchBrands = async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('brands')
        .select('id, name, normalized_name, category_id')
        .eq('active', true)
        .order('name')
        .limit(20);

      if (categoryId) {
        queryBuilder = queryBuilder.eq('category_id', categoryId);
      }

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      setOptions(
        (data || []).map(brand => ({
          id: brand.id,
          value: brand.name,
          label: brand.name
        }))
      );
    } catch (error: any) {
      console.error('Error searching brands:', error);
      toast({
        title: 'Error',
        description: 'Failed to search brands',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchBrands('');
  }, [categoryId]);

  const handleQuickAdd = async (name: string) => {
    try {
      if (!categoryName) {
        toast({
          title: 'Error',
          description: 'Please select a category first',
          variant: 'destructive'
        });
        throw new Error('No category selected');
      }
      
      console.log('[SearchableBrandSelect] Fetching category ID for:', categoryName);
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .eq('active', true)
        .maybeSingle();
      
      const currentCategoryId = catData?.id;
      if (currentCategoryId) {
        setCategoryId(currentCategoryId);
      }
    
      if (!currentCategoryId) {
        toast({
          title: 'Error',
          description: 'Category not found. Please reselect category.',
          variant: 'destructive'
        });
        throw new Error('Category not found');
      }

      console.log('[SearchableBrandSelect] Upserting brand:', name, 'for category ID:', currentCategoryId);
      
      const titleCaseName = name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Check if brand exists for this category
      const { data: existing } = await supabase
        .from('brands')
        .select('id, name')
        .eq('category_id', currentCategoryId)
        .ilike('name', titleCaseName)
        .eq('active', true)
        .maybeSingle();

      let result;
      if (existing) {
        // Already exists - use it
        result = existing;
        console.log('[SearchableBrandSelect] Brand exists:', result);
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('brands')
          .insert({
            name: titleCaseName,
            category_id: currentCategoryId,
            active: true
          })
          .select()
          .single();

        if (error) {
          console.error('[SearchableBrandSelect] Insert error:', error);
          throw error;
        }

        result = inserted;
        console.log('[SearchableBrandSelect] Brand created:', result);
        
        toast({
          title: 'Saved ✓',
          description: `Brand "${titleCaseName}" added`
        });
      }

      onValueChange(result.name);
      await searchBrands('');
    } catch (error: any) {
      console.error('[SearchableBrandSelect] Error saving brand:', error);
      if (!error.message.includes('No category') && !error.message.includes('Category not found')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save brand',
          variant: 'destructive'
        });
      }
      throw error;
    }
  };

  return (
    <SearchableSelect
      value={value}
      onValueChange={onValueChange}
      options={options}
      onSearch={searchBrands}
      onQuickAdd={handleQuickAdd}
      placeholder="Select brand..."
      searchPlaceholder="Search brands..."
      disabled={disabled || !categoryName}
      loading={loading}
      emptyMessage={categoryName ? 'No brands found' : 'Select a category first'}
      allowQuickAdd={true}
    />
  );
}
