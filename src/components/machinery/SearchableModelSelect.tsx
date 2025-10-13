import React, { useState, useEffect } from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchableModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  brandName?: string;
  categoryName?: string;
  onBrandCreated?: (brandName: string) => void;
  disabled?: boolean;
}

export function SearchableModelSelect({ value, onValueChange, brandName, categoryName, onBrandCreated, disabled }: SearchableModelSelectProps) {
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
          description: 'Please enter a brand first',
          variant: 'destructive'
        });
        throw new Error('No brand selected');
      }
      
      console.log('[SearchableModelSelect] Fetching/creating brand:', brandName);
      
      // Step 1: Try to find existing brand
      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name')
        .ilike('name', brandName)
        .eq('active', true)
        .maybeSingle();
      
      let currentBrandId = brandData?.id;
      let finalBrandName = brandData?.name || brandName;
      
      // Step 2: If brand doesn't exist, auto-create it
      if (!currentBrandId) {
        if (!categoryName) {
          toast({
            title: 'Error',
            description: 'Please select a category first',
            variant: 'destructive'
          });
          throw new Error('No category selected');
        }
        
        console.log('[SearchableModelSelect] Brand not found, auto-creating:', brandName, 'for category:', categoryName);
        
        // Get category ID
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', categoryName)
          .eq('active', true)
          .maybeSingle();
        
        if (!categoryData?.id) {
          toast({
            title: 'Error',
            description: 'Category not found. Please reselect category.',
            variant: 'destructive'
          });
          throw new Error('Category not found');
        }
        
        const titleCaseBrand = brandName
          .trim()
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        // Check if brand exists with normalized name
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id, name')
          .eq('category_id', categoryData.id)
          .ilike('name', titleCaseBrand)
          .eq('active', true)
          .maybeSingle();
        
        if (existingBrand) {
          currentBrandId = existingBrand.id;
          finalBrandName = existingBrand.name;
          console.log('[SearchableModelSelect] Brand exists:', existingBrand);
        } else {
          // Create new brand
          const { data: newBrand, error: brandError } = await supabase
            .from('brands')
            .insert({
              name: titleCaseBrand,
              category_id: categoryData.id,
              active: true
            })
            .select()
            .single();
          
          if (brandError) {
            console.error('[SearchableModelSelect] Brand creation error:', brandError);
            throw brandError;
          }
          
          currentBrandId = newBrand.id;
          finalBrandName = newBrand.name;
          console.log('[SearchableModelSelect] Brand auto-created:', newBrand);
          
          // Notify parent to update brand selection
          if (onBrandCreated) {
            onBrandCreated(finalBrandName);
          }
        }
      }
      
      if (currentBrandId) {
        setBrandId(currentBrandId);
      }

      // Step 3: Create/select model under the brand
      console.log('[SearchableModelSelect] Upserting model:', name, 'for brand ID:', currentBrandId);
      
      const titleCaseModel = name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Check if model exists for this brand
      const { data: existingModel } = await supabase
        .from('machinery_models')
        .select('id, name')
        .eq('brand_id', currentBrandId)
        .ilike('name', titleCaseModel)
        .eq('active', true)
        .maybeSingle();

      let result;
      if (existingModel) {
        // Already exists - use it
        result = existingModel;
        console.log('[SearchableModelSelect] Model exists:', result);
      } else {
        // Insert new model
        const { data: inserted, error } = await supabase
          .from('machinery_models')
          .insert({
            name: titleCaseModel,
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
          description: `Model "${titleCaseModel}" added`
        });
      }

      onValueChange(result.name);
      await searchModels('');
    } catch (error: any) {
      console.error('[SearchableModelSelect] Error saving model:', error);
      if (!error.message.includes('No brand') && !error.message.includes('No category') && !error.message.includes('Category not found')) {
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
      emptyMessage={brandName ? 'No models found' : 'Enter a brand first'}
      allowQuickAdd={true}
    />
  );
}
