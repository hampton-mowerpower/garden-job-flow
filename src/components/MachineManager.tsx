import React from 'react';
import { Label } from '@/components/ui/label';
import { SearchableCategorySelect } from '@/components/machinery/SearchableCategorySelect';
import { SearchableBrandSelect } from '@/components/machinery/SearchableBrandSelect';
import { SearchableModelSelect } from '@/components/machinery/SearchableModelSelect';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
// Removed: import { useAutoSave } from '@/hooks/useAutoSave'; - No auto-saving in job editing

interface MachineManagerProps {
  machineCategory: string;
  machineBrand: string;
  machineModel: string;
  onCategoryChange: (category: string) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
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

  // REMOVED: Auto-save logic - machine data now saves ONLY when user clicks "Save" button

  // Handle category change and clear dependent fields
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    onBrandChange('');
    onModelChange('');
    
    toast({
      title: 'Saved ✓',
      description: 'Category selected'
    });
  };

  // Handle brand change and clear model
  const handleBrandChange = (value: string) => {
    onBrandChange(value);
    onModelChange('');
    
    toast({
      title: 'Saved ✓',
      description: 'Brand selected'
    });
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    onModelChange(value);
    
    toast({
      title: 'Saved ✓',
      description: 'Model selected'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <SearchableCategorySelect
          value={machineCategory}
          onValueChange={handleCategoryChange}
        />
      </div>

      <div>
        <Label htmlFor="brand">Brand *</Label>
        <SearchableBrandSelect
          value={machineBrand}
          onValueChange={handleBrandChange}
          categoryName={machineCategory}
        />
      </div>

      <div>
        <Label htmlFor="model">Model *</Label>
        <SearchableModelSelect
          value={machineModel}
          onValueChange={handleModelChange}
          brandName={machineBrand}
          categoryName={machineCategory}
          onBrandCreated={handleBrandChange}
        />
      </div>

      <div className="md:col-span-3">
        <Label htmlFor="serial">Serial Number (Optional)</Label>
        <Input
          id="serial"
          placeholder="Enter serial number..."
          className="w-full"
        />
      </div>
    </div>
  );
};
