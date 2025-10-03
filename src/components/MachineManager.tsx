import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MACHINE_CATEGORIES } from '@/data/machineCategories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MachineManagerProps {
  machineCategory: string;
  machineBrand: string;
  machineModel: string;
  onCategoryChange: (category: string) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
}

interface CustomMachineData {
  categories: string[];
  brands: { [category: string]: string[] };
  models: { [category: string]: { [brand: string]: string[] } };
}

export const MachineManager: React.FC<MachineManagerProps> = ({
  machineCategory,
  machineBrand,
  machineModel,
  onCategoryChange,
  onBrandChange,
  onModelChange
}) => {
  const { toast } = useToast();
  const [customData, setCustomData] = useState<CustomMachineData>({
    categories: [],
    brands: {},
    models: {}
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadCustomData();
  }, []);

  // Auto-save brand when typed
  useEffect(() => {
    if (machineBrand && machineCategory && !isStandardBrand(machineBrand)) {
      saveBrand(machineBrand, machineCategory);
    }
  }, [machineBrand, machineCategory]);

  // Auto-save model when typed
  useEffect(() => {
    if (machineModel && machineCategory && machineBrand) {
      saveModel(machineModel, machineCategory, machineBrand);
    }
  }, [machineModel, machineCategory, machineBrand]);

  const isStandardBrand = (brand: string): boolean => {
    const selectedCategory = MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
    return selectedCategory?.commonBrands.includes(brand) || false;
  };

  const loadCustomData = async () => {
    try {
      setIsLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_machine_data')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const newCustomData: CustomMachineData = {
        categories: [],
        brands: {},
        models: {}
      };

      data?.forEach((item) => {
        if (item.data_type === 'category') {
          if (!newCustomData.categories.includes(item.value)) {
            newCustomData.categories.push(item.value);
          }
        } else if (item.data_type === 'brand' && item.category) {
          if (!newCustomData.brands[item.category]) {
            newCustomData.brands[item.category] = [];
          }
          if (!newCustomData.brands[item.category].includes(item.value)) {
            newCustomData.brands[item.category].push(item.value);
          }
        } else if (item.data_type === 'model' && item.category && item.brand) {
          if (!newCustomData.models[item.category]) {
            newCustomData.models[item.category] = {};
          }
          if (!newCustomData.models[item.category][item.brand]) {
            newCustomData.models[item.category][item.brand] = [];
          }
          if (!newCustomData.models[item.category][item.brand].includes(item.value)) {
            newCustomData.models[item.category][item.brand].push(item.value);
          }
        }
      });

      setCustomData(newCustomData);
    } catch (error) {
      console.error('Error loading custom machine data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const saveCategory = async (category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already exists (case-insensitive)
      const normalizedCategory = category.trim().toLowerCase();
      if (customData.categories.some(c => c.toLowerCase() === normalizedCategory)) {
        return;
      }

      await supabase.from('custom_machine_data').insert({
        user_id: user.id,
        data_type: 'category',
        value: category.trim()
      });

      await loadCustomData();
    } catch (error: any) {
      if (!error.message?.includes('duplicate key')) {
        console.error('Error saving category:', error);
      }
    }
  };

  const saveBrand = async (brand: string, category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already exists (case-insensitive)
      const normalizedBrand = brand.trim().toLowerCase();
      const existingBrands = customData.brands[category] || [];
      if (existingBrands.some(b => b.toLowerCase() === normalizedBrand)) {
        return;
      }

      await supabase.from('custom_machine_data').insert({
        user_id: user.id,
        data_type: 'brand',
        category: category,
        value: brand.trim()
      });

      await loadCustomData();
    } catch (error: any) {
      if (!error.message?.includes('duplicate key')) {
        console.error('Error saving brand:', error);
      }
    }
  };

  const saveModel = async (model: string, category: string, brand: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already exists (case-insensitive)
      const normalizedModel = model.trim().toLowerCase();
      const existingModels = customData.models[category]?.[brand] || [];
      if (existingModels.some(m => m.toLowerCase() === normalizedModel)) {
        return;
      }

      await supabase.from('custom_machine_data').insert({
        user_id: user.id,
        data_type: 'model',
        category: category,
        brand: brand,
        value: model.trim()
      });

      await loadCustomData();
    } catch (error: any) {
      if (!error.message?.includes('duplicate key')) {
        console.error('Error saving model:', error);
      }
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'other-custom') {
      // Let user type their own category
      onCategoryChange('');
      onBrandChange('');
      onModelChange('');
    } else {
      onCategoryChange(value);
      onBrandChange('');
      onModelChange('');
    }
  };

  const handleCustomCategoryBlur = async () => {
    if (machineCategory && !MACHINE_CATEGORIES.find(cat => cat.id === machineCategory)) {
      await saveCategory(machineCategory);
    }
  };

  const selectedCategory = MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const availableBrands = selectedCategory ? [
    ...selectedCategory.commonBrands,
    ...(customData.brands[machineCategory] || [])
  ] : (customData.brands[machineCategory] || []);

  const availableModels = machineCategory && machineBrand ? 
    customData.models[machineCategory]?.[machineBrand] || [] : [];

  // Combine standard and custom categories
  const allCategories = [
    ...MACHINE_CATEGORIES,
    ...customData.categories.map(cat => ({
      id: cat,
      name: cat,
      labourRate: 0,
      commonBrands: []
    }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="machine-category">Category *</Label>
        {machineCategory && !MACHINE_CATEGORIES.find(cat => cat.id === machineCategory) ? (
          <Input
            id="machine-category"
            value={machineCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            onBlur={handleCustomCategoryBlur}
            placeholder="Enter custom category"
          />
        ) : (
          <Select value={machineCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select machine category" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} {category.labourRate > 0 && `($${category.labourRate}/hr)`}
                </SelectItem>
              ))}
              <SelectItem value="other-custom">Other (Add Custom)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div>
        <Label htmlFor="machine-brand">Brand</Label>
        <Input
          id="machine-brand"
          value={machineBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          placeholder="Type or select brand"
          list="brand-list"
        />
        <datalist id="brand-list">
          {availableBrands.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
      </div>

      <div>
        <Label htmlFor="machine-model">Model</Label>
        <Input
          id="machine-model"
          value={machineModel}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder="Type or select model"
          list="model-list"
        />
        <datalist id="model-list">
          {availableModels.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
      </div>
    </div>
  );
};
