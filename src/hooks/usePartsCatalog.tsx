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
        // Normalize category: "Battery Multi-Tool" -> "Multi-Tool"
        const normalizedCategory = equipmentCategory.replace(/^Battery\s+/i, '');
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
