import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

interface Category {
  id: string;
  name: string;
  rate_default: number;
  active: boolean;
}

interface Brand {
  id: string;
  name: string;
  active: boolean;
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
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbBrands, setDbBrands] = useState<Brand[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomData();
    loadDbCategories();
    loadDbBrands();

    // Setup realtime subscriptions
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories'
      }, () => {
        loadDbCategories();
      })
      .subscribe();

    const brandsChannel = supabase
      .channel('brands-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'brands'
      }, () => {
        loadDbBrands();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(brandsChannel);
    };
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

  const loadDbCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setDbCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDbBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setDbBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSaving(true);
    try {
      const trimmedName = newCategoryName.trim();
      
      // Check if category already exists (case-insensitive)
      const normalizedName = trimmedName.toLowerCase();
      const existing = dbCategories.find(cat => cat.name.toLowerCase() === normalizedName);
      
      if (existing) {
        toast({
          title: "Already exists",
          description: `"${trimmedName}" already exists in categories.`
        });
        onCategoryChange(existing.name);
        setShowCategoryInput(false);
        setNewCategoryName('');
        return;
      }

      // Insert new category
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: trimmedName,
          rate_default: 0,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Category added",
        description: `"${trimmedName}" has been added.`
      });

      // Select the new category
      onCategoryChange(data.name);
      setShowCategoryInput(false);
      setNewCategoryName('');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;

    setIsSaving(true);
    try {
      const trimmedName = newBrandName.trim();
      
      // Check if brand already exists (case-insensitive)
      const normalizedName = trimmedName.toLowerCase();
      const existing = dbBrands.find(brand => brand.name.toLowerCase() === normalizedName);
      
      if (existing) {
        toast({
          title: "Already exists",
          description: `"${trimmedName}" already exists in brands.`
        });
        onBrandChange(existing.name);
        setShowBrandInput(false);
        setNewBrandName('');
        return;
      }

      // Insert new brand
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: trimmedName,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Brand added",
        description: `"${trimmedName}" has been added.`
      });

      // Select the new brand
      onBrandChange(data.name);
      setShowBrandInput(false);
      setNewBrandName('');
    } catch (error: any) {
      console.error('Error adding brand:', error);
      toast({
        title: "Error",
        description: "Failed to add brand",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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

  // Combine DB categories with standard categories
  const allCategories = [
    ...MACHINE_CATEGORIES.map(cat => ({ id: cat.id, name: cat.name, rate: cat.labourRate })),
    ...dbCategories.map(cat => ({ id: cat.name, name: cat.name, rate: cat.rate_default }))
  ];

  // Combine DB brands with category-specific brands
  const selectedCat = MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const availableBrands = [
    ...(selectedCat?.commonBrands || []),
    ...dbBrands.map(b => b.name)
  ];

  const availableModels = machineCategory && machineBrand ? 
    customData.models[machineCategory]?.[machineBrand] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="machine-category">Category *</Label>
        {showCategoryInput ? (
          <div className="space-y-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
                if (e.key === 'Escape') {
                  setShowCategoryInput(false);
                  setNewCategoryName('');
                }
              }}
              onBlur={handleAddCategory}
              placeholder="Enter new category name..."
              disabled={isSaving}
              autoFocus
            />
            {isSaving && <Badge variant="secondary" className="text-xs">Saving...</Badge>}
          </div>
        ) : (
          <Select
            value={machineCategory}
            onValueChange={(value) => {
              if (value === '__other__') {
                setShowCategoryInput(true);
                setNewCategoryName('');
              } else {
                onCategoryChange(value);
                onBrandChange('');
                onModelChange('');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select machine category" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} {category.rate > 0 && `($${category.rate}/hr)`}
                </SelectItem>
              ))}
              <SelectItem value="__other__">Other (Add New...)</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div>
        <Label htmlFor="machine-brand">Brand</Label>
        {showBrandInput ? (
          <div className="space-y-2">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBrand();
                }
                if (e.key === 'Escape') {
                  setShowBrandInput(false);
                  setNewBrandName('');
                }
              }}
              onBlur={handleAddBrand}
              placeholder="Enter new brand name..."
              disabled={isSaving}
              autoFocus
            />
            {isSaving && <Badge variant="secondary" className="text-xs">Saving...</Badge>}
          </div>
        ) : (
          <Select
            value={machineBrand}
            onValueChange={(value) => {
              if (value === '__other__') {
                setShowBrandInput(true);
                setNewBrandName('');
              } else {
                onBrandChange(value);
                onModelChange('');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select or add brand" />
            </SelectTrigger>
            <SelectContent>
              {availableBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
              <SelectItem value="__other__">Other (Add New...)</SelectItem>
            </SelectContent>
          </Select>
        )}
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
