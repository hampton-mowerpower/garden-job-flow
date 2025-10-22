import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  in_stock: boolean;
  active: boolean;
}

export const useRealtimeParts = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // REMOVED: Realtime subscription to reduce CPU load
  // Parts will update on manual refresh or after operations
  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('parts_catalogue')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (fetchError) throw fetchError;
      
      const typedParts: Part[] = (data || []).map((d: any) => ({
        id: d.id,
        sku: d.sku,
        name: d.name,
        category: d.category,
        base_price: Number(d.base_price),
        sell_price: Number(d.sell_price),
        in_stock: Boolean(d.in_stock),
        active: d.deleted_at === null
      }));
      
      setParts(typedParts.filter(p => p.active));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { parts, loading, error, refetch: loadParts };
};
