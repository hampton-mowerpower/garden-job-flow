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

  useEffect(() => {
    if (!brandName) {
      setBrandId(null);
      return;
    }

    const fetchBrandId = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', brandName)
        .eq('active', true)
        .maybeSingle();

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

  useEffect(() => {
    searchModels('');
  }, [brandId]);

  const handleQuickAdd = async (name: string) => {
    try {
      if (!brandName) {
        toast({
          title: 'Error',
          description: 'Please select a brand first',
          variant: 'destructive'
        });
        throw new Error('No brand selected');
      }
      
      console.log('[SearchableModelSelect] Fetching brand ID for:', brandName);
      const { data: brandData } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', brandName)
        .eq('active', true)
        .maybeSingle();
      
      const currentBrandId = brandData?.id;
      if (currentBrandId) {
        setBrandId(currentBrandId);
      }
    
      if (!currentBrandId) {
        toast({
          title: 'Error',
          description: 'Brand not found. Please reselect brand.',
          variant: 'destructive'
        });
        throw new Error('Brand not found');
      }

      console.log('[SearchableModelSelect] Upserting model:', name, 'for brand ID:', currentBrandId);
      
      const titleCaseName = name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Check if model exists for this brand
      const { data: existing } = await supabase
        .from('machinery_models')
        .select('id, name')
        .eq('brand_id', currentBrandId)
        .ilike('name', titleCaseName)
        .eq('active', true)
        .maybeSingle();

      let result;
      if (existing) {
        // Already exists - use it
        result = existing;
        console.log('[SearchableModelSelect] Model exists:', result);
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('machinery_models')
          .insert({
            name: titleCaseName,
            brand_id: currentBrandId,
            active: true
          })
          .select()
          .single();

        if (error) {
          console.error('[SearchableModelSelect] Insert error:', error);
          throw error;
        }

        result = inserted;
        console.log('[SearchableModelSelect] Model created:', result);
        
        toast({
          title: 'Saved ✓',
          description: `Model "${titleCaseName}" added`
        });
      }

      onValueChange(result.name);
      await searchModels('');
    } catch (error: any) {
      console.error('[SearchableModelSelect] Error saving model:', error);
      if (!error.message.includes('No brand') && !error.message.includes('Brand not found')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save model',
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
