import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputCurrency } from '@/components/ui/input-currency';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Download, Upload } from 'lucide-react';
import { Part } from '@/types/job';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { A4_PARTS, PART_CATEGORIES } from '@/data/a4Parts';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface PartsManagerProps {
  onPartsUpdate?: (parts: Part[]) => void;
}

export const PartsManager: React.FC<PartsManagerProps> = ({ onPartsUpdate }) => {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [globalMarkup, setGlobalMarkup] = useState<number>(20);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      await jobBookingDB.init();
      const customParts = await jobBookingDB.getCustomParts();
      
      // Convert built-in parts to Part format
      const allBuiltInParts = [...DEFAULT_PARTS, ...A4_PARTS];
      const allParts = [...allBuiltInParts, ...customParts.map(cp => ({
        id: cp.partId,
        name: cp.partName,
        category: cp.category || 'General',
        basePrice: cp.unitPrice * 0.8, // Estimate base price from sell price
        sellPrice: cp.unitPrice,
        markup: 20,
        inStock: true,
        description: ''
      }))];
      
      setParts(allParts);
      onPartsUpdate?.(allParts);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const saveParts = async () => {
    try {
      // Only save custom parts (not built-in ones)
      const builtInIds = [...DEFAULT_PARTS, ...A4_PARTS].map(p => p.id);
      const customParts = parts
        .filter(part => !builtInIds.includes(part.id))
        .map(part => ({
          partId: part.id,
          partName: part.name,
          quantity: 1,
          unitPrice: part.sellPrice,
          totalPrice: part.sellPrice,
          category: part.category
        }));
      
      await jobBookingDB.saveCustomParts(customParts);
      toast({
        title: "Success",
        description: "Parts saved successfully"
      });
    } catch (error) {
      console.error('Error saving parts:', error);
      toast({
        title: "Error",
        description: "Failed to save parts",
        variant: "destructive"
      });
    }
  };

  const addPart = () => {
    const newPart: Part = {
      id: `custom-${Date.now()}`,
      name: '',
      category: 'General',
      basePrice: 0,
      sellPrice: 0,
      markup: globalMarkup,
      inStock: true,
      description: ''
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (index: number, updates: Partial<Part>) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], ...updates };
    
    // Auto-calculate sell price if base price or markup changes
    if (updates.basePrice !== undefined || updates.markup !== undefined) {
      const basePrice = updates.basePrice ?? updatedParts[index].basePrice;
      const markup = updates.markup ?? updatedParts[index].markup ?? globalMarkup;
      updatedParts[index].sellPrice = basePrice * (1 + markup / 100);
    }
    
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
  };

  const removePart = (index: number) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
  };

  const applyGlobalMarkup = () => {
    const updatedParts = parts.map(part => ({
      ...part,
      markup: globalMarkup,
      sellPrice: part.basePrice * (1 + globalMarkup / 100)
    }));
    setParts(updatedParts);
    onPartsUpdate?.(updatedParts);
  };

  const exportPartsCSV = () => {
    const csvHeaders = ['Name', 'Category', 'Base Price', 'Sell Price', 'Markup %', 'In Stock', 'Description'];
    const csvRows = parts.map(part => [
      part.name,
      part.category,
      part.basePrice.toFixed(2),
      part.sellPrice.toFixed(2),
      part.markup?.toString() || '0',
      part.inStock ? 'Yes' : 'No',
      part.description || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hampton-mowerpower-parts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Parts exported to CSV successfully"
    });
  };

  const getFilteredParts = () => {
    if (selectedCategory === 'All') return parts;
    return parts.filter(part => part.category === selectedCategory);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Parts Management
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addPart}>
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
            <Button variant="outline" size="sm" onClick={exportPartsCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="default" size="sm" onClick={saveParts}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Global Markup Control */}
          <div className="flex items-end gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label>Global Markup Percentage</Label>
              <Input
                type="number"
                value={globalMarkup}
                onChange={(e) => setGlobalMarkup(Number(e.target.value))}
                placeholder="20"
              />
            </div>
            <Button onClick={applyGlobalMarkup} variant="outline">
              Apply to All Parts
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <Label>Filter by Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {PART_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parts List */}
          <div className="space-y-4">
            {getFilteredParts().map((part, index) => {
              const actualIndex = parts.findIndex(p => p.id === part.id);
              return (
                <div key={part.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Label>Part Name</Label>
                    <Input
                      value={part.name}
                      onChange={(e) => updatePart(actualIndex, { name: e.target.value })}
                      placeholder="Enter part name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Category</Label>
                    <Select 
                      value={part.category} 
                      onValueChange={(value) => updatePart(actualIndex, { category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PART_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Base Price</Label>
                    <InputCurrency
                      value={part.basePrice}
                      onChange={(value) => updatePart(actualIndex, { basePrice: value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Markup %</Label>
                    <Input
                      type="number"
                      value={part.markup || 0}
                      onChange={(e) => updatePart(actualIndex, { markup: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Sell Price</Label>
                    <InputCurrency
                      value={part.sellPrice}
                      onChange={(value) => updatePart(actualIndex, { sellPrice: value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Stock</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm">
                      {part.inStock ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePart(actualIndex)}
                      className="w-full"
                      disabled={[...DEFAULT_PARTS, ...A4_PARTS].some(p => p.id === part.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};