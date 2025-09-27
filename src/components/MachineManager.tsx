import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MACHINE_CATEGORIES } from '@/data/machineCategories';
import { jobBookingDB } from '@/lib/storage';

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
  const [customData, setCustomData] = useState<CustomMachineData>({
    categories: [],
    brands: {},
    models: {}
  });
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  useEffect(() => {
    loadCustomData();
  }, []);

  useEffect(() => {
    setIsOtherBrand(machineBrand === 'other');
    if (machineBrand !== 'other') {
      setCustomBrandInput('');
    }
  }, [machineBrand]);

  const loadCustomData = async () => {
    try {
      await jobBookingDB.init();
      const data = await jobBookingDB.getCustomMachineData();
      setCustomData(data);
    } catch (error) {
      console.error('Error loading custom machine data:', error);
    }
  };

  const saveCustomData = async (newData: CustomMachineData) => {
    try {
      await jobBookingDB.saveCustomMachineData(newData);
      setCustomData(newData);
    } catch (error) {
      console.error('Error saving custom machine data:', error);
    }
  };

  const handleBrandChange = async (value: string) => {
    if (value === 'other') {
      setIsOtherBrand(true);
      onBrandChange('other');
    } else {
      setIsOtherBrand(false);
      onBrandChange(value);
    }
    // Clear model when brand changes
    onModelChange('');
  };

  const handleCustomBrandSubmit = async () => {
    if (customBrandInput.trim() && machineCategory) {
      const newData = { ...customData };
      if (!newData.brands[machineCategory]) {
        newData.brands[machineCategory] = [];
      }
      if (!newData.brands[machineCategory].includes(customBrandInput.trim())) {
        newData.brands[machineCategory].push(customBrandInput.trim());
        await saveCustomData(newData);
      }
      onBrandChange(customBrandInput.trim());
      setIsOtherBrand(false);
      setCustomBrandInput('');
    }
  };

  const handleCustomModelSubmit = async () => {
    if (customModelInput.trim() && machineCategory && machineBrand) {
      const newData = { ...customData };
      if (!newData.models[machineCategory]) {
        newData.models[machineCategory] = {};
      }
      if (!newData.models[machineCategory][machineBrand]) {
        newData.models[machineCategory][machineBrand] = [];
      }
      if (!newData.models[machineCategory][machineBrand].includes(customModelInput.trim())) {
        newData.models[machineCategory][machineBrand].push(customModelInput.trim());
        await saveCustomData(newData);
      }
      onModelChange(customModelInput.trim());
      setCustomModelInput('');
    }
  };

  const selectedCategory = MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const availableBrands = selectedCategory ? [
    ...selectedCategory.commonBrands,
    ...(customData.brands[machineCategory] || [])
  ] : [];

  const availableModels = machineCategory && machineBrand ? 
    customData.models[machineCategory]?.[machineBrand] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="machine-category">Category *</Label>
        <Select value={machineCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select machine category" />
          </SelectTrigger>
          <SelectContent>
            {MACHINE_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} (${category.labourRate}/hr)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="machine-brand">Brand</Label>
        <Select value={machineBrand} onValueChange={handleBrandChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            {availableBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
            <SelectItem value="other">Other (Add New)</SelectItem>
          </SelectContent>
        </Select>
        {isOtherBrand && (
          <div className="flex gap-2 mt-2">
            <Input
              value={customBrandInput}
              onChange={(e) => setCustomBrandInput(e.target.value)}
              placeholder="Enter new brand name"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomBrandSubmit()}
            />
            <button
              type="button"
              onClick={handleCustomBrandSubmit}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="machine-model">Model</Label>
        <Select value={machineModel} onValueChange={onModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select or enter model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
            <SelectItem value="custom">Add New Model</SelectItem>
          </SelectContent>
        </Select>
        {machineModel === 'custom' && (
          <div className="flex gap-2 mt-2">
            <Input
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              placeholder="Enter new model name"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomModelSubmit()}
            />
            <button
              type="button"
              onClick={handleCustomModelSubmit}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Add
            </button>
          </div>
        )}
        {machineModel !== 'custom' && machineModel && (
          <Input
            className="mt-2"
            value={machineModel}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Or type model manually"
          />
        )}
      </div>
    </div>
  );
};