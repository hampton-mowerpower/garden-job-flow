import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, Plus, Trash2 } from 'lucide-react';
import {
  calculateSharpenPrice,
  SharpenItem,
  ChainsawBarSize,
  ChainsawMode,
  HedgeTrimmerType,
  SharpenPricing
} from '@/utils/sharpenCalculator';

interface SharpenSectionProps {
  onSharpenChange: (data: {
    items: SharpenItem[];
    totalCharge: number;
    breakdown: string;
  }) => void;
  initialData?: {
    items?: SharpenItem[];
  };
}

export const SharpenSection: React.FC<SharpenSectionProps> = ({
  onSharpenChange,
  initialData
}) => {
  const [items, setItems] = useState<SharpenItem[]>(initialData?.items || []);

  useEffect(() => {
    calculateAndNotify();
  }, [items]);

  const calculateAndNotify = () => {
    if (items.length === 0) {
      onSharpenChange({
        items: [],
        totalCharge: 0,
        breakdown: ''
      });
      return;
    }

    let totalCharge = 0;
    const breakdownParts: string[] = [];

    items.forEach(item => {
      const pricing = calculateSharpenPrice(item);
      totalCharge += pricing.totalPrice;
      breakdownParts.push(`${pricing.description} = $${pricing.totalPrice.toFixed(2)}`);
    });

    onSharpenChange({
      items,
      totalCharge,
      breakdown: breakdownParts.join(' | ')
    });
  };

  const addChainsawItem = () => {
    const newItem: SharpenItem = {
      type: 'chainsaw',
      barSize: '14-16',
      linkCount: 50,
      mode: 'chain-only',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addGardenToolItem = () => {
    const newItem: SharpenItem = {
      type: 'garden-tool',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addKnifeItem = () => {
    const newItem: SharpenItem = {
      type: 'knife',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addHedgeTrimmerItem = (hedgeTrimmerType: HedgeTrimmerType) => {
    const newItem: SharpenItem = {
      type: 'hedge-trimmer',
      hedgeTrimmerType,
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addCylinderMowerItem = () => {
    const newItem: SharpenItem = {
      type: 'cylinder-mower',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addHandMowerItem = () => {
    const newItem: SharpenItem = {
      type: 'hand-mower',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const addLawnMowerBladeItem = () => {
    const newItem: SharpenItem = {
      type: 'lawn-mower-blade',
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, updates: Partial<SharpenItem>) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    
    // Type-safe update based on item type
    if (currentItem.type === 'chainsaw' && 'barSize' in updates) {
      newItems[index] = { ...currentItem, ...updates } as SharpenItem;
    } else if (currentItem.type !== 'chainsaw' && 'quantity' in updates) {
      newItems[index] = { ...currentItem, quantity: updates.quantity || 1 } as SharpenItem;
    } else {
      newItems[index] = { ...currentItem, ...updates } as SharpenItem;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalCharge = () => {
    return items.reduce((sum, item) => {
      return sum + calculateSharpenPrice(item).totalPrice;
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Sharpen Services
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChainsawItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Chainsaw
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGardenToolItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Garden Tool
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addKnifeItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Knife
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addHedgeTrimmerItem('battery')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Hedge Trimmer (Battery)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addHedgeTrimmerItem('petrol')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Hedge Trimmer (Petrol)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addHedgeTrimmerItem('electric')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Hedge Trimmer (Electric)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCylinderMowerItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Cylinder Mower
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHandMowerItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Hand Mower
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLawnMowerBladeItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Lawn Mower Blade
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => {
              const pricing = calculateSharpenPrice(item);
              
              return (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{item.type} Sharpen</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {item.type === 'chainsaw' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label>Bar Size</Label>
                        <Select
                          value={item.barSize}
                          onValueChange={(value) => updateItem(index, { barSize: value as ChainsawBarSize })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="14-16">14-16"</SelectItem>
                            <SelectItem value="18+">18"+ (includes 18")</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Link Count</Label>
                        <Input
                          type="number"
                          min="1"
                          max="200"
                          value={item.linkCount}
                          onChange={(e) => updateItem(index, { linkCount: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <Label>Mode</Label>
                        <Select
                          value={item.mode}
                          onValueChange={(value) => updateItem(index, { mode: value as ChainsawMode })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chain-only">Chain-only</SelectItem>
                            <SelectItem value="whole-saw">Whole chainsaw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {item.type === 'hedge-trimmer' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={item.hedgeTrimmerType}
                          onValueChange={(value) => updateItem(index, { hedgeTrimmerType: value as HedgeTrimmerType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="battery">Battery - $95</SelectItem>
                            <SelectItem value="petrol">Petrol - $95</SelectItem>
                            <SelectItem value="electric">Electric - $65</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Memo (optional)</Label>
                        <Textarea
                          value={item.memo || ''}
                          onChange={(e) => updateItem(index, { memo: e.target.value })}
                          placeholder="Add notes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {(item.type === 'garden-tool' || item.type === 'knife' || 
                    item.type === 'cylinder-mower' || item.type === 'hand-mower' || 
                    item.type === 'lawn-mower-blade') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                          ${pricing.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      {(item.type === 'cylinder-mower' || item.type === 'hand-mower' || item.type === 'lawn-mower-blade') && (
                        <div className="col-span-2">
                          <Label>Memo (optional)</Label>
                          <Textarea
                            value={item.memo || ''}
                            onChange={(e) => updateItem(index, { memo: e.target.value })}
                            placeholder="Add notes..."
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{pricing.description}</span>
                      <span className="font-bold">${pricing.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total Sharpen Services:</span>
                <span className="font-bold text-lg">${getTotalCharge().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sharpen services added. Click the buttons above to add items.
          </p>
        )}

        {/* Pricing Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Chainsaw (14-16" & ≤60 links):</strong> Chain-only $18, Whole-saw $22</p>
          <p><strong>Chainsaw (≥18" or ≥61 links):</strong> Chain-only $25, Whole-saw $29</p>
          <p><strong>Hedge Trimmer:</strong> Battery $95 • Petrol $95 • Electric $65</p>
          <p><strong>Mowers:</strong> Cylinder $125 • Hand $75 • Blade $35</p>
          <p><strong>Other:</strong> Garden Tool $18 • Knife $8</p>
        </div>
      </CardContent>
    </Card>
  );
};