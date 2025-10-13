import React, { useState, useEffect } from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchableCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SearchableCategorySelect({ value, onValueChange, disabled }: SearchableCategorySelectProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCategories = async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('categories')
        .select('id, name, normalized_name')
        .eq('active', true)
        .order('name')
        .limit(20);

      if (query) {
        // Fuzzy search on normalized name
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      setOptions(
        (data || []).map(cat => ({
          id: cat.id,
          value: cat.name,
          label: cat.name
        }))
      );
    } catch (error: any) {
      console.error('Error searching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to search categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial options
  useEffect(() => {
    searchCategories('');
  }, []);

  const handleQuickAdd = async (name: string) => {
    try {
      // Title case the name
      const titleCaseName = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: titleCaseName,
          rate_default: 95,
          active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already exists',
            description: `"${titleCaseName}" already exists`,
            variant: 'destructive'
          });
          throw new Error('Duplicate');
        }
        throw error;
      }

      toast({
        title: 'Saved ✓',
        description: `Category "${titleCaseName}" created`
      });

      // Refresh options first, then auto-select
      await searchCategories('');
      onValueChange(data.name);
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.message !== 'Duplicate') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create category',
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
      onSearch={searchCategories}
      onQuickAdd={handleQuickAdd}
      placeholder="Select category..."
      searchPlaceholder="Search categories..."
      disabled={disabled}
      loading={loading}
      emptyMessage="No categories found"
      allowQuickAdd={true}
    />
  );
}
