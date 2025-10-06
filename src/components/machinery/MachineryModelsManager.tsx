import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface MachineryModel {
  id: string;
  brand_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  description: string | null;
  default_price: number | null;
  cost_price: number | null;
  tax_code: string;
  requires_engine_serial: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export function MachineryModelsManager() {
  const [models, setModels] = useState<MachineryModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<Partial<MachineryModel> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modelsRes, brandsRes] = await Promise.all([
        supabase.from('machinery_models').select('*, brand:brands(id, name)').order('name'),
        supabase.from('brands').select('id, name').eq('active', true).order('name')
      ]);

      if (modelsRes.error) throw modelsRes.error;
      if (brandsRes.error) throw brandsRes.error;

      setModels((modelsRes.data || []) as MachineryModel[]);
      setBrands((brandsRes.data || []) as Brand[]);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingModel?.brand_id || !editingModel?.name) {
      toast({
        title: 'Required fields missing',
        description: 'Please enter brand and model name',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingModel.id) {
        const { error } = await supabase
          .from('machinery_models')
          .update(editingModel)
          .eq('id', editingModel.id);

        if (error) throw error;
        toast({ title: 'Model updated successfully' });
      } else {
        const { error } = await supabase
          .from('machinery_models')
          .insert([editingModel as any]);

        if (error) throw error;
        toast({ title: 'Model created successfully' });
      }

      setDialogOpen(false);
      setEditingModel(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error saving model',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (model?: MachineryModel) => {
    setEditingModel(model || {
      brand_id: '',
      name: '',
      sku: '',
      tax_code: 'GST',
      requires_engine_serial: false,
      active: true
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Machinery Models</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => openEditDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModel?.id ? 'Edit Model' : 'Add New Model'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select
                  value={editingModel?.brand_id || ''}
                  onValueChange={(value) => setEditingModel({ ...editingModel, brand_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Model Name *</Label>
                <Input
                  id="name"
                  value={editingModel?.name || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  placeholder="e.g., HRU196 Buffalo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={editingModel?.sku || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, sku: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingModel?.category || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, category: e.target.value })}
                    placeholder="e.g., Lawn Mower"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default_price">Default Price (ex GST)</Label>
                  <Input
                    id="default_price"
                    type="number"
                    step="0.01"
                    value={editingModel?.default_price || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, default_price: parseFloat(e.target.value) || null })}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={editingModel?.cost_price || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, cost_price: parseFloat(e.target.value) || null })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingModel?.description || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                  placeholder="Optional product description"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="requires_engine_serial"
                    checked={editingModel?.requires_engine_serial || false}
                    onCheckedChange={(checked) =>
                      setEditingModel({ ...editingModel, requires_engine_serial: checked as boolean })
                    }
                  />
                  <Label htmlFor="requires_engine_serial">Requires Engine Serial</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={editingModel?.active ?? true}
                    onCheckedChange={(checked) =>
                      setEditingModel({ ...editingModel, active: checked })
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading models...</div>
        ) : models.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No models yet. Add your first model to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (ex GST)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.brand?.name || '—'}</TableCell>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.sku || '—'}</TableCell>
                  <TableCell>{model.category || '—'}</TableCell>
                  <TableCell>
                    {model.default_price ? `$${model.default_price.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={model.active ? 'text-green-600' : 'text-muted-foreground'}>
                      {model.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(model)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}