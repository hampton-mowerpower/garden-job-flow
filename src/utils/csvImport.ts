// @ts-nocheck
// CSV Import utility for Parts Master v16
import { supabase } from '@/integrations/supabase/client';

export interface CSVPart {
  sku: string;
  equipment_category: string;
  part_group: string;
  part_name: string;
  base_price: number;
  sell_price: number;
  tax_code: string;
  active: boolean;
  notes: string;
}

export const parseCSV = (csvText: string): CSVPart[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const parts: CSVPart[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    // Map CSV columns to our schema
    const part: CSVPart = {
      sku: values[0] || `AUTO-${Date.now()}-${i}`,
      equipment_category: values[1] || '',
      part_group: values[2] || 'Other',
      part_name: values[3] || '',
      base_price: parseFloat(values[4]) || 0,
      sell_price: parseFloat(values[5]) || 0,
      tax_code: values[6] || 'GST',
      active: values[7]?.toLowerCase() === 'yes',
      notes: values[10] || ''
    };
    
    // Skip if no part name or category
    if (part.part_name && part.equipment_category) {
      parts.push(part);
    }
  }
  
  return parts;
};

export const importPartsToSupabase = async (
  parts: CSVPart[],
  categoryFilter?: string
): Promise<{ success: number; errors: string[] }> => {
  const errors: string[] = [];
  let success = 0;
  
  for (const part of parts) {
    // Skip if category filter is set and doesn't match
    if (categoryFilter && part.equipment_category !== categoryFilter) {
      continue;
    }
    
    try {
      // Check if part exists by SKU and category
      const { data: existing } = await supabase
        .from('parts_catalogue')
        .select('id')
        .eq('sku', part.sku)
        .eq('category', part.equipment_category)
        .single();
      
      if (existing) {
        // Update existing part
        const { error } = await supabase
          .from('parts_catalogue')
          .update({
            name: part.part_name,
            part_group: part.part_group,
            base_price: part.base_price,
            sell_price: part.sell_price,
            in_stock: part.active,
            description: part.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new part
        const { error } = await supabase
          .from('parts_catalogue')
          .insert({
            sku: part.sku,
            name: part.part_name,
            category: part.equipment_category,
            part_group: part.part_group,
            base_price: part.base_price,
            sell_price: part.sell_price,
            in_stock: part.active,
            description: part.notes,
            stock_quantity: 0
          });
        
        if (error) throw error;
      }
      
      success++;
    } catch (error: any) {
      errors.push(`${part.part_name}: ${error.message}`);
    }
  }
  
  return { success, errors };
};

export const preloadCommonParts = async (categoryName: string): Promise<void> => {
  try {
    // Try v17 first, fallback to v16
    let csvText = '';
    try {
      const response = await fetch('/parts_master_v17.csv');
      csvText = await response.text();
    } catch {
      const response = await fetch('/parts_master_v16.csv');
      csvText = await response.text();
    }
    
    const allParts = parseCSV(csvText);
    
    // Filter parts for this category
    const categoryParts = allParts.filter(p => p.equipment_category === categoryName);
    
    if (categoryParts.length === 0) {
      console.log(`No preload parts found for category: ${categoryName}`);
      return;
    }
    
    // Insert parts without prices (set to 0)
    let successCount = 0;
    for (const part of categoryParts) {
      try {
        // Check if part already exists
        const { data: existing } = await supabase
          .from('parts_catalogue')
          .select('id')
          .eq('category', categoryName)
          .eq('name', part.part_name)
          .single();
        
        if (existing) continue; // Skip if exists
        
        const { error } = await supabase
          .from('parts_catalogue')
          .insert({
            sku: part.sku || `AUTO-${Date.now()}-${Math.random()}`,
            name: part.part_name,
            category: categoryName,
            part_group: part.part_group,
            base_price: 0, // No price initially
            sell_price: 0, // No price initially
            in_stock: true,
            description: `Preloaded - needs pricing`,
            stock_quantity: 0
          });
        
        if (!error) successCount++;
      } catch (err: any) {
        // Silently continue on errors (likely duplicates)
        console.log(`Skipped part ${part.part_name}:`, err.message);
      }
    }
    
    console.log(`Preloaded ${successCount} parts for ${categoryName}`);
  } catch (error) {
    console.error('Error preloading common parts:', error);
    throw error;
  }
};
