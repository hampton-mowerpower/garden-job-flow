// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width?: number;
}

export const useColumnReorder = (tableKey: string, defaultColumns: ColumnConfig[]) => {
  const { toast } = useToast();
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLayout();
  }, [tableKey]);

  const loadLayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setColumns(defaultColumns);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_table_layouts')
        .select('column_order')
        .eq('user_id', user.id)
        .eq('table_key', tableKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.column_order && Array.isArray(data.column_order)) {
        const savedOrder = data.column_order as any[];
        // Merge with defaults to handle new columns
        const merged = savedOrder
          .filter((saved: any) => saved && typeof saved === 'object' && 'key' in saved)
          .map((saved: any) => {
            const defaultCol = defaultColumns.find(d => d.key === saved.key);
            return defaultCol ? { ...defaultCol, ...saved } : saved;
          }) as ColumnConfig[];
        // Add any new columns not in saved order
        defaultColumns.forEach(def => {
          if (!merged.find(m => m.key === def.key)) {
            merged.push(def);
          }
        });
        setColumns(merged);
      } else {
        setColumns(defaultColumns);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      setColumns(defaultColumns);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (newColumns: ColumnConfig[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_table_layouts')
        .upsert({
          user_id: user.id,
          table_key: tableKey,
          column_order: newColumns as any
        });

      if (error) throw error;

      toast({
        title: 'Layout saved',
        description: 'Column order updated successfully'
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: 'Error',
        description: 'Failed to save layout',
        variant: 'destructive'
      });
    }
  };

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [removed] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, removed);
    setColumns(newColumns);
    saveLayout(newColumns);
  };

  const toggleColumnVisibility = (key: string) => {
    const newColumns = columns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setColumns(newColumns);
    saveLayout(newColumns);
  };

  const resetToDefault = () => {
    setColumns(defaultColumns);
    saveLayout(defaultColumns);
  };

  return {
    columns,
    loading,
    reorderColumns,
    toggleColumnVisibility,
    resetToDefault
  };
};
