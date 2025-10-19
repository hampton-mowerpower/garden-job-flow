import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

interface PartsCatalogueItem {
  id: string;
  sku: string;
  upc?: string;
  name: string;
  description?: string;
  category: string;
  base_price: number;
  sell_price: number;
  markup?: number;
  competitor_price?: number;
  source?: string;
  in_stock: boolean;
  stock_quantity: number;
  supplier?: string;
}

interface PartFormData {
  sku: string;
  upc: string;
  name: string;
  description: string;
  category: string;
  base_price: string;
  sell_price: string;
  markup: string;
  competitor_price: string;
  source: string;
  in_stock: boolean;
  stock_quantity: string;
  supplier: string;
}

const CATEGORIES = [
  'Engine Parts',
  'Electrical',
  'Hydraulics',
  'Transmission',
  'Filters',
  'Belts & Hoses',
  'Hardware',
  'Tools',
  'Other'
];

export function PartsCatalogue() {
  const [parts, setParts] = useState<PartsCatalogueItem[]>([]);
  const [filteredParts, setFilteredParts] = useState<PartsCatalogueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartsCatalogueItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<PartFormData>({
    sku: '',
    upc: '',
    name: '',
    description: '',
    category: '',
    base_price: '',
    sell_price: '',
    markup: '',
    competitor_price: '',
    source: '',
    in_stock: true,
    stock_quantity: '0',
    supplier: ''
  });

  const { hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm, selectedCategory]);

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_catalogue')
        .select('*')
        .order('name');

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      toast({
        title: "Error loading parts",
        description: "Failed to load parts catalogue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    setFilteredParts(filtered);
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      upc: '',
      name: '',
      description: '',
      category: '',
      base_price: '',
      sell_price: '',
      markup: '',
      competitor_price: '',
      source: '',
      in_stock: true,
      stock_quantity: '0',
      supplier: ''
    });
    setEditingPart(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const partData = {
      part_number: formData.sku, // Use SKU as part number
      sku: formData.sku,
      upc: formData.upc || null,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      base_price: parseFloat(formData.base_price),
      sell_price: parseFloat(formData.sell_price),
      markup: formData.markup ? parseFloat(formData.markup) : null,
      competitor_price: formData.competitor_price ? parseFloat(formData.competitor_price) : null,
      source: formData.source || null,
      in_stock: formData.in_stock,
      stock_quantity: parseInt(formData.stock_quantity),
      supplier: formData.supplier || null,
    };

    try {
      if (editingPart) {
        const { error } = await supabase
          .from('parts_catalogue')
          .update(partData)
          .eq('id', editingPart.id);
        
        if (error) throw error;
        
        toast({
          title: "Part updated",
          description: "Part has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('parts_catalogue')
          .insert([partData]);
        
        if (error) throw error;
        
        toast({
          title: "Part added",
          description: "New part has been added to the catalogue.",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
      loadParts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (part: PartsCatalogueItem) => {
    setFormData({
      sku: part.sku,
      upc: part.upc || '',
      name: part.name,
      description: part.description || '',
      category: part.category,
      base_price: part.base_price.toString(),
      sell_price: part.sell_price.toString(),
      markup: part.markup?.toString() || '',
      competitor_price: part.competitor_price?.toString() || '',
      source: part.source || '',
      in_stock: part.in_stock,
      stock_quantity: part.stock_quantity.toString(),
      supplier: part.supplier || ''
    });
    setEditingPart(part);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part?')) return;
    
    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Part deleted",
        description: "Part has been removed from the catalogue.",
      });
      
      loadParts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading parts catalogue...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <CardTitle>Parts Catalogue</CardTitle>
            </div>
            {hasPermission('all') && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPart ? 'Edit Part' : 'Add New Part'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="upc">UPC</Label>
                        <Input
                          id="upc"
                          value={formData.upc}
                          onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="name">Part Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="base_price">Base Price *</Label>
                        <Input
                          id="base_price"
                          type="number"
                          step="0.01"
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sell_price">Sell Price *</Label>
                        <Input
                          id="sell_price"
                          type="number"
                          step="0.01"
                          value={formData.sell_price}
                          onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="markup">Markup %</Label>
                        <Input
                          id="markup"
                          type="number"
                          step="0.01"
                          value={formData.markup}
                          onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="competitor_price">Competitor Price</Label>
                        <Input
                          id="competitor_price"
                          type="number"
                          step="0.01"
                          value={formData.competitor_price}
                          onChange={(e) => setFormData({ ...formData, competitor_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="source">Source</Label>
                        <Input
                          id="source"
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingPart ? 'Update Part' : 'Add Part'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Input
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                {hasPermission('all') && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('all') ? 7 : 6} className="text-center">
                    No parts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono">{part.sku}</TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>${part.sell_price.toFixed(2)}</TableCell>
                    <TableCell>{part.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={part.in_stock ? "default" : "secondary"}>
                        {part.in_stock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    {hasPermission('all') && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(part)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(part.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}