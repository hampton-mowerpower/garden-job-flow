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
      throw new Error('No brand selected');
    }

    try {
      console.log('[SearchableModelSelect] Creating model:', name);
      
      // Normalize and title case the name
      const titleCaseName = name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      console.log('[SearchableModelSelect] Inserting:', { titleCaseName, brandId });

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
        console.error('[SearchableModelSelect] Insert error:', error);
        if (error.code === '23505') {
          // Model already exists for this brand - find and select it
          const { data: existing } = await supabase
            .from('machinery_models')
            .select('id, name')
            .eq('brand_id', brandId)
            .ilike('name', titleCaseName)
            .eq('active', true)
            .single();
          
          if (existing) {
            onValueChange(existing.name);
            await searchModels('');
            toast({
              title: 'Model selected',
              description: `"${existing.name}" already exists and has been selected`
            });
            return;
          }
        }
        throw error;
      }

      console.log('[SearchableModelSelect] Model created:', data);

      toast({
        title: 'Saved ✓',
        description: `Model "${titleCaseName}" created`
      });

      // Set value first so the UI shows it immediately
      onValueChange(data.name);
      console.log('[SearchableModelSelect] Value set to:', data.name);
      
      // Then refresh options in background
      await searchModels('');
      console.log('[SearchableModelSelect] Options refreshed');
    } catch (error: any) {
      console.error('[SearchableModelSelect] Error creating model:', error);
      if (error.message !== 'No brand selected') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create model',
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
