// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Check, FileText, Download, Upload, Loader2, Trash2 } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseCSV, importPartsToSupabase } from '@/utils/csvImport';

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  part_group: string | null;
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
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      const text = await file.text();
      const parsedParts = parseCSV(text);
      
      // Import only for selected category
      const result = await importPartsToSupabase(parsedParts, selectedCategory || undefined);
      
      toast({
        title: 'Import Complete',
        description: `${result.success} parts imported. ${result.errors.length} errors.`,
        variant: result.errors.length > 0 ? 'destructive' : 'default'
      });
      
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors.slice(0, 10));
      }
      
      // Reload parts
      if (selectedCategory) {
        await loadParts(selectedCategory);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import CSV file',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkImportFromMaster = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Error',
        description: 'Please select a category first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setImporting(true);
      
      // Try both v16 and v17 CSV files
      let csvText = '';
      try {
        const response = await fetch('/parts_master_v17.csv');
        csvText = await response.text();
      } catch {
        const response = await fetch('/parts_master_v16.csv');
        csvText = await response.text();
      }
      
      const { parseCSV, importPartsToSupabase } = await import('@/utils/csvImport');
      
      const allParts = parseCSV(csvText);
      const categoryParts = allParts.filter(p => p.equipment_category === selectedCategory);
      
      if (categoryParts.length === 0) {
        toast({
          title: 'No Parts Found',
          description: `No parts found for category "${selectedCategory}" in master CSV`,
          variant: 'destructive'
        });
        return;
      }
      
      const result = await importPartsToSupabase(allParts, selectedCategory);
      
      toast({
        title: 'Import Complete',
        description: `Imported ${result.success} parts for ${selectedCategory}. ${result.errors.length} errors.`,
        variant: result.errors.length > 0 ? 'destructive' : 'default'
      });
      
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors.slice(0, 10));
      }
      
      await loadParts(selectedCategory);
    } catch (error: any) {
      console.error('Bulk import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import parts: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    // Check if category has parts
    if (parts.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: 'Remove all parts from this category before deleting it.',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Delete category "${selectedCategory}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ active: false })
        .eq('name', selectedCategory);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted'
      });

      // Reload categories
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Delete this part? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', partId);

      if (error) throw error;

      setParts(prev => prev.filter(p => p.id !== partId));
      toast({
        title: 'Success',
        description: 'Part deleted'
      });
    } catch (error) {
      console.error('Error deleting part:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete part',
        variant: 'destructive'
      });
    }
  };

  const handleExportCSV = () => {
    if (filteredParts.length === 0) return;
    
    const headers = ['SKU', 'Equipment Category', 'Part Group', 'Part Name', 'Base Price', 'Sell Price', 'Tax Code', 'Active', 'Notes'];
    const rows = filteredParts.map(part => [
      part.sku,
      part.category,
      part.part_group || '',
      part.name,
      part.base_price,
      part.sell_price,
      'GST',
      part.in_stock ? 'Yes' : 'No',
      part.description || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCategory}_parts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
                <Button 
                  onClick={handleBulkImportFromMaster}
                  size="sm" 
                  variant="outline"
                  disabled={importing || !selectedCategory}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import v16
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  size="sm" 
                  variant="outline"
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </>
                  )}
                </Button>
                <Button onClick={handleExportCSV} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleDeleteCategory} size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Category
                </Button>
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
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground mb-2">
                          No parts found for <strong>{selectedCategory}</strong>
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={handleBulkImportFromMaster}>
                            <Upload className="h-4 w-4 mr-2" />
                            Bulk Import v16
                          </Button>
                          <Button size="sm" onClick={handleAddPart}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Part Manually
                          </Button>
                        </div>
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
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => startEdit(part)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeletePart(part.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
