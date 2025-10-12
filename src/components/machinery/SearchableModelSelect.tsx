import React, { useState, useEffect } from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchableModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  brandName?: string;
  disabled?: boolean;
}

export function SearchableModelSelect({ value, onValueChange, brandName, disabled }: SearchableModelSelectProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Get brand ID from name
  useEffect(() => {
    if (!brandName) {
      setBrandId(null);
      return;
    }

    const fetchBrandId = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id')
        .eq('name', brandName)
        .eq('active', true)
        .single();

      setBrandId(data?.id || null);
    };

    fetchBrandId();
  }, [brandName]);

  const searchModels = async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('machinery_models')
        .select('id, name, normalized_name, brand_id')
        .eq('active', true)
        .order('name')
        .limit(20);

      // Filter by brand if selected
      if (brandId) {
        queryBuilder = queryBuilder.eq('brand_id', brandId);
      }

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,normalized_name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      setOptions(
        (data || []).map(model => ({
          id: model.id,
          value: model.name,
          label: model.name
        }))
      );
    } catch (error: any) {
      console.error('Error searching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to search models',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh when brand changes
  useEffect(() => {
    searchModels('');
  }, [brandId]);

  const handleQuickAdd = async (name: string) => {
    if (!brandId) {
      toast({
        title: 'Error',
        description: 'Please select a brand first',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Title case the name
      const titleCaseName = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const { data, error } = await supabase
        .from('machinery_models')
        .insert({
          name: titleCaseName,
          brand_id: brandId,
          active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already exists',
            description: `"${titleCaseName}" already exists for this brand`,
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Saved ✓',
        description: `Model "${titleCaseName}" created`
      });

      // Auto-select the new model
      onValueChange(data.name);
      
      // Refresh options
      await searchModels('');
    } catch (error: any) {
      console.error('Error creating model:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create model',
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
      onSearch={searchModels}
      onQuickAdd={handleQuickAdd}
      placeholder="Select model..."
      searchPlaceholder="Search models..."
      disabled={disabled || !brandName}
      loading={loading}
      emptyMessage={brandName ? 'No models found' : 'Select a brand first'}
      allowQuickAdd={true}
    />
  );
}
