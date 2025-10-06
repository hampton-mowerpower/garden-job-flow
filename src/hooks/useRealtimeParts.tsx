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

  useEffect(() => {
    loadParts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('parts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parts_catalogue'
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          setParts(current => {
            if (eventType === 'INSERT' && newRecord && !newRecord.deleted_at) {
              const part: Part = {
                id: newRecord.id,
                sku: newRecord.sku,
                name: newRecord.name,
                category: newRecord.category,
                base_price: Number(newRecord.base_price),
                sell_price: Number(newRecord.sell_price),
                in_stock: Boolean(newRecord.in_stock),
                active: newRecord.deleted_at === null
              };
              return [...current, part].sort((a, b) => a.name.localeCompare(b.name));
            }
            
            if (eventType === 'UPDATE' && newRecord) {
              if (newRecord.deleted_at) {
                return current.filter(p => p.id !== newRecord.id);
              }
              const part: Part = {
                id: newRecord.id,
                sku: newRecord.sku,
                name: newRecord.name,
                category: newRecord.category,
                base_price: Number(newRecord.base_price),
                sell_price: Number(newRecord.sell_price),
                in_stock: Boolean(newRecord.in_stock),
                active: newRecord.deleted_at === null
              };
              return current.map(p => 
                p.id === newRecord.id ? part : p
              ).sort((a, b) => a.name.localeCompare(b.name));
            }
            
            if (eventType === 'DELETE' && oldRecord) {
              return current.filter(p => p.id !== oldRecord.id);
            }
            
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
