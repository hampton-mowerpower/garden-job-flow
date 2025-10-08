import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CatalogPart {
  id: string;
  sku: string;
  name: string; // part_name
  category: string; // equipment_category
  base_price: number;
  sell_price: number;
  in_stock: boolean;
  description?: string;
  category_id?: string;
  brand_id?: string;
}

// Map equipment categories to parts catalogue categories
const normalizeCategoryForParts = (category: string): string => {
  if (!category) return '';
  
  // Remove "Battery" prefix first
  let normalized = category.replace(/^Battery\s+/i, '').trim();
  
  // Map common variations to catalogue categories
  const categoryMap: Record<string, string> = {
    'lawn-mowers': 'Lawn Mower',
    'lawn mower': 'Lawn Mower',
    'lawnmower': 'Lawn Mower',
    'ride-on-mowers': 'Ride-On',
    'ride-on': 'Ride-On',
    'rideon': 'Ride-On',
    'chainsaws': 'Chainsaw',
    'chainsaw': 'Chainsaw',
    'brushcutters': 'Brushcutter / Line Trimmer',
    'brushcutter': 'Brushcutter / Line Trimmer',
    'line trimmer': 'Brushcutter / Line Trimmer',
    'hedge-trimmers': 'Hedge Trimmer',
    'hedge trimmer': 'Hedge Trimmer',
    'hedgetrimmer': 'Hedge Trimmer',
    'blowers': 'Blower & Vacuum',
    'blower': 'Blower & Vacuum',
    'vacuum': 'Blower & Vacuum',
    'pressure-washers': 'Pressure Washer',
    'pressure washer': 'Pressure Washer',
    'generators': 'Generator',
    'generator': 'Generator',
    'multi-tool': 'Multi-Tool',
    'multi tool': 'Multi-Tool',
    'multitool': 'Multi-Tool',
    'battery multi-tool': 'Multi-Tool',
    'battery multi tool': 'Multi-Tool',
  };
  
  // Try exact match first (case-insensitive)
  const lowerCategory = normalized.toLowerCase();
  if (categoryMap[lowerCategory]) {
    return categoryMap[lowerCategory];
  }
  
  // Return as-is if no mapping found (already trimmed and battery-prefix removed)
  return normalized;
};

export const usePartsCatalog = (equipmentCategory?: string) => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadParts();
  }, [equipmentCategory]);

  const loadParts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('parts_catalogue')
        .select('*')
        .eq('in_stock', true)
        .is('deleted_at', null);

      if (equipmentCategory) {
        const normalizedCategory = normalizeCategoryForParts(equipmentCategory);
        console.log('Parts lookup:', { 
          original: equipmentCategory, 
          normalized: normalizedCategory 
        });
        query = query.eq('category', normalizedCategory);
      }

      const { data, error: queryError } = await query.order('name');

      if (queryError) throw queryError;
      
      setParts(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading parts catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPartsByCategory = (): Record<string, any[]> => {
    return parts.reduce((acc, part) => {
      const cat = part.category || 'Other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(part);
      return acc;
    }, {} as Record<string, any[]>);
  };

  return {
    parts,
    partsByCategory: getPartsByCategory(),
    loading,
    error,
    refetch: loadParts
  };
};
