import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Check, FileText, Download, Upload } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  markup: number | null;
  in_stock: boolean;
  description: string | null;
  stock_quantity: number;
}

export const PartsManagementAdmin: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPart, setEditedPart] = useState<Partial<Part>>({});

  // Load categories
  useEffect(() => {
    loadCategories();
    
    // Subscribe to category changes
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load parts when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadParts(selectedCategory);
    }
  }, [selectedCategory]);

  // Filter parts based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = parts.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts(parts);
    }
  }, [searchTerm, parts]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;

      const categoryNames = data?.map(c => c.name) || [];
      setCategories(categoryNames);
      
      if (!selectedCategory && categoryNames.length > 0) {
        setSelectedCategory(categoryNames[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async (category: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts_catalogue')
        .select('*')
        .eq('category', category)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      setParts(data || []);
      setFilteredParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async () => {
    if (!selectedCategory) return;

    try {
      const newPart = {
        sku: `SKU-${Date.now()}`,
        name: 'New Part',
        category: selectedCategory,
        base_price: 0,
        sell_price: 0,
        markup: 20,
        in_stock: true,
        stock_quantity: 0,
        description: ''
      };

      const { data, error } = await supabase
        .from('parts_catalogue')
        .insert(newPart)
        .select()
        .single();

      if (error) throw error;

      setParts(prev => [...prev, data]);
      setEditingId(data.id);
      setEditedPart(data);

      toast({
        title: 'Success',
        description: 'New part added'
      });
    } catch (error) {
      console.error('Error adding part:', error);
      toast({
        title: 'Error',
        description: 'Failed to add part',
        variant: 'destructive'
      });
    }
  };

  const handleSavePart = async (partId: string) => {
    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .update(editedPart)
        .eq('id', partId);

      if (error) throw error;

      setParts(prev => prev.map(p => p.id === partId ? { ...p, ...editedPart } : p));
      setEditingId(null);
      setEditedPart({});

      toast({
        title: 'Saved ✓',
        description: 'Part updated successfully'
      });
    } catch (error) {
      console.error('Error saving part:', error);
      toast({
        title: 'Error',
        description: 'Failed to save part',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (part: Part) => {
    setEditingId(part.id);
    setEditedPart(part);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedPart({});
  };

  const updateEditedField = (field: keyof Part, value: any) => {
    setEditedPart(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel - Categories */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-1">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {category}
                    {selectedCategory === category && (
                      <Badge variant="outline" className="ml-auto">
                        {parts.length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Parts List */}
      <div className="col-span-9">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedCategory} - Parts
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button onClick={handleAddPart} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">SKU</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead className="w-[100px]">Base Price</TableHead>
                    <TableHead className="w-[100px]">Sell Price</TableHead>
                    <TableHead className="w-[80px]">Markup %</TableHead>
                    <TableHead className="w-[80px]">Stock</TableHead>
                    <TableHead className="w-[100px]">In Stock</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No parts found. Click "Add Part" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParts.map(part => {
                      const isEditing = editingId === part.id;
                      const displayPart = isEditing ? { ...part, ...editedPart } : part;

                      return (
                        <TableRow key={part.id}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={displayPart.sku}
                                onChange={(e) => updateEditedField('sku', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span className="text-xs font-mono">{part.sku}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={displayPart.name}
                                onChange={(e) => updateEditedField('name', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              part.name
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={displayPart.base_price}
                                onChange={(e) => updateEditedField('base_price', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              `$${part.base_price.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={displayPart.sell_price}
                                onChange={(e) => updateEditedField('sell_price', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              `$${part.sell_price.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={displayPart.markup || 0}
                                onChange={(e) => updateEditedField('markup', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              `${part.markup || 0}%`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={displayPart.stock_quantity}
                                onChange={(e) => updateEditedField('stock_quantity', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              part.stock_quantity
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select
                                value={displayPart.in_stock ? 'yes' : 'no'}
                                onValueChange={(val) => updateEditedField('in_stock', val === 'yes')}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={part.in_stock ? 'default' : 'secondary'}>
                                {part.in_stock ? 'Yes' : 'No'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="default" onClick={() => handleSavePart(part.id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => startEdit(part)}>
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
