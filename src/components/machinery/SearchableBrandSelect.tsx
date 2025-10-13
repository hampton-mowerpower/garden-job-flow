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

  // Get category ID from name
  useEffect(() => {
    if (!categoryName) {
      setCategoryId(null);
      return;
    }

    const fetchCategoryId = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('active', true)
        .single();

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

      // Filter by category if selected
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

  // Refresh when category changes
  useEffect(() => {
    searchBrands('');
  }, [categoryId]);

  const handleQuickAdd = async (name: string) => {
    try {
      console.log('[SearchableBrandSelect] Creating brand:', name);
      
      // Normalize and title case the name
      const titleCaseName = name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      console.log('[SearchableBrandSelect] Inserting:', { titleCaseName, categoryId });

      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: titleCaseName,
          category_id: categoryId,
          active: true
        })
        .select()
        .single();

      if (error) {
        console.error('[SearchableBrandSelect] Insert error:', error);
        if (error.code === '23505') {
          // Brand already exists in this category - find and select it
          const { data: existing } = await supabase
            .from('brands')
            .select('id, name')
            .eq('category_id', categoryId)
            .ilike('name', titleCaseName)
            .eq('active', true)
            .single();
          
          if (existing) {
            onValueChange(existing.name);
            await searchBrands('');
            toast({
              title: 'Brand selected',
              description: `"${existing.name}" already exists and has been selected`
            });
            return;
          }
        }
        throw error;
      }

      console.log('[SearchableBrandSelect] Brand created:', data);

      toast({
        title: 'Saved ✓',
        description: `Brand "${titleCaseName}" created`
      });

      // Set value first so the UI shows it immediately
      onValueChange(data.name);
      console.log('[SearchableBrandSelect] Value set to:', data.name);
      
      // Then refresh options in background
      await searchBrands('');
      console.log('[SearchableBrandSelect] Options refreshed');
    } catch (error: any) {
      console.error('[SearchableBrandSelect] Error creating brand:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create brand',
        variant: 'destructive'
      });
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
