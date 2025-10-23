// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { usePartsCatalog } from '@/hooks/usePartsCatalog';
import { Plus, Minus, Search, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  description?: string;
  supplier?: string;
}

interface PartWithGroup extends Part {
  part_group?: string;
}

interface PartsPickerProps {
  equipmentCategory: string;
  onAddPart: (part: Part, quantity: number, overridePrice?: number) => void;
}

export const PartsPicker: React.FC<PartsPickerProps> = ({
  equipmentCategory,
  onAddPart
}) => {
  const { toast } = useToast();
  const { parts, loading, error, refetch } = usePartsCatalog(equipmentCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [overridePrices, setOverridePrices] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    sku: '',
    price: 0,
    quantity: 1
  });

  // Group parts by part_group
  const partsByGroup = useMemo(() => {
    const grouped: Record<string, PartWithGroup[]> = {};
    
    parts.forEach((part: any) => {
      const group = part.part_group || 'Other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(part);
    });

    // Sort groups alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, PartWithGroup[]>);
  }, [parts]);

  // Filter parts by search query
  const filteredPartsByGroup = useMemo(() => {
    if (!searchQuery.trim()) return partsByGroup;

    const filtered: Record<string, PartWithGroup[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(partsByGroup).forEach(([group, groupParts]) => {
      const matchingParts = groupParts.filter(part =>
        part.name.toLowerCase().includes(query) ||
        part.sku.toLowerCase().includes(query) ||
        part.description?.toLowerCase().includes(query)
      );

      if (matchingParts.length > 0) {
        filtered[group] = matchingParts;
      }
    });

    return filtered;
  }, [partsByGroup, searchQuery]);

  const handleAddPart = (part: Part) => {
    console.log('[PartsPicker] Adding part:', {
      id: part.id,
      name: part.name,
      sku: part.sku,
      price: part.sell_price,
      base_price: part.base_price
    });
    
    const qty = quantities[part.id] || 1;
    const overridePrice = overridePrices[part.id];
    
    console.log('[PartsPicker] Quantity:', qty, 'Override price:', overridePrice);
    
    if (qty <= 0) {
      console.error('[PartsPicker] Invalid quantity:', qty);
      toast({
        title: 'Invalid quantity',
        description: 'Quantity must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    console.log('[PartsPicker] Calling parent onAddPart callback...');
    onAddPart(part, qty, overridePrice);
    console.log('[PartsPicker] Part added to local state successfully');
    
    // Reset quantity and override for this part
    setQuantities(prev => ({ ...prev, [part.id]: 1 }));
    setOverridePrices(prev => {
      const updated = { ...prev };
      delete updated[part.id];
      return updated;
    });

    toast({
      title: 'Part added',
      description: `${part.name} x${qty} added to job`
    });
  };

  const updateQuantity = (partId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[partId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [partId]: newQty };
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleAddNewPart = async () => {
    if (!newPart.name.trim() || newPart.price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Part name and price are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create new part in catalog
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('parts_catalogue')
        .insert({
          name: newPart.name,
          sku: newPart.sku || `CUSTOM-${Date.now()}`,
          category: equipmentCategory,
          base_price: newPart.price,
          sell_price: newPart.price,
          in_stock: true,
          part_group: 'Custom Parts'
        })
        .select()
        .single();

      if (error) throw error;

      // Add to job immediately
      const part: Part = {
        id: data.id,
        sku: data.sku,
        name: data.name,
        category: data.category,
        base_price: data.base_price,
        sell_price: data.sell_price
      };

      onAddPart(part, newPart.quantity);

      toast({
        title: 'Part created',
        description: `${newPart.name} added to catalog and job`
      });

      // Reset form
      setNewPart({ name: '', sku: '', price: 0, quantity: 1 });
      setShowAddNew(false);

      // Refresh parts list
      refetch();
    } catch (error: any) {
      console.error('Error adding new part:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new part',
        variant: 'destructive'
      });
    }
  };

  // Auto-expand first group if only one group
  useEffect(() => {
    const groups = Object.keys(filteredPartsByGroup);
    if (groups.length === 1 && !expandedGroups[groups[0]]) {
      setExpandedGroups({ [groups[0]]: true });
    }
  }, [filteredPartsByGroup]);

  if (!equipmentCategory) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Select an equipment category to view available parts
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading parts catalog...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Error loading parts: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (parts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            No parts available for <strong>{equipmentCategory}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Add parts in Admin → Parts Management or import from Parts Master v16
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('/#/admin', '_blank')}
            >
              Go to Admin
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddNew(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Part Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parts for {equipmentCategory}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{parts.length} parts</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddNew(!showAddNew)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New Part
            </Button>
          </div>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Add New Part Form */}
        {showAddNew && (
          <div className="mt-4 p-4 border rounded-lg bg-accent/10">
            <h4 className="font-semibold mb-3">Add New Part to Catalog</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Part Name *</Label>
                <Input
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Throttle Return Spring"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={newPart.sku}
                  onChange={(e) => setNewPart(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Sell Price * ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPart.price || ''}
                  onChange={(e) => setNewPart(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddNew(false);
                  setNewPart({ name: '', sku: '', price: 0, quantity: 1 });
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNewPart}
              >
                Create & Add to Job
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {Object.keys(filteredPartsByGroup).length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No parts match your search
          </p>
        ) : (
          Object.entries(filteredPartsByGroup).map(([group, groupParts]) => (
            <Collapsible
              key={group}
              open={expandedGroups[group]}
              onOpenChange={() => toggleGroup(group)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto hover:bg-accent"
                >
                  <span className="font-semibold">{group}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{groupParts.length}</Badge>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedGroups[group] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {groupParts.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{part.name}</p>
                        {part.sku && (
                          <Badge variant="outline" className="text-xs">
                            {part.sku}
                          </Badge>
                        )}
                      </div>
                      {part.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {part.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-green-600">
                          ${part.sell_price.toFixed(2)}
                        </span>
                        {part.base_price !== part.sell_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${part.base_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(part.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                          {quantities[part.id] || 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(part.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="relative w-24">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={part.sell_price.toFixed(2)}
                          value={overridePrices[part.id] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setOverridePrices(prev => ({
                                ...prev,
                                [part.id]: value
                              }));
                            } else {
                              setOverridePrices(prev => {
                                const updated = { ...prev };
                                delete updated[part.id];
                                return updated;
                              });
                            }
                          }}
                          className="pl-6 h-8 text-xs"
                          title="Override price"
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddPart(part)}
                        className="h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
};
