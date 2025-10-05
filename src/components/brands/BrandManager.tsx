import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brand } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      setBrands((data || []) as Brand[]);
    } catch (error: any) {
      toast({
        title: 'Error loading brands',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingBrand?.name) {
      toast({
        title: 'Name required',
        description: 'Please enter a brand name',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBrand.id) {
        const { error } = await supabase
          .from('brands')
          .update(editingBrand)
          .eq('id', editingBrand.id);

        if (error) throw error;
        toast({ title: 'Brand updated successfully' });
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([editingBrand as any]);

        if (error) throw error;
        toast({ title: 'Brand created successfully' });
      }

      setDialogOpen(false);
      setEditingBrand(null);
      loadBrands();
    } catch (error: any) {
      toast({
        title: 'Error saving brand',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (brand?: Brand) => {
    setEditingBrand(brand || {
      name: '',
      active: true,
      oem_export_required: false,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Brand Management</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openEditDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBrand?.id ? 'Edit Brand' : 'Add New Brand'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={editingBrand?.name || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    placeholder="e.g., Honda, Husqvarna"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={editingBrand?.website || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={editingBrand?.supplier || ''}
                    onChange={(e) => setEditingBrand({ ...editingBrand, supplier: e.target.value })}
                    placeholder="Main supplier name"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="oem_export_required"
                    checked={editingBrand?.oem_export_required || false}
                    onCheckedChange={(checked) => 
                      setEditingBrand({ ...editingBrand, oem_export_required: checked as boolean })
                    }
                  />
                  <Label htmlFor="oem_export_required">OEM Warranty Export Required</Label>
                </div>

                {editingBrand?.oem_export_required && (
                  <div className="grid gap-2">
                    <Label htmlFor="format">OEM Export Format</Label>
                    <Select
                      value={editingBrand?.oem_export_format || ''}
                      onValueChange={(value) => 
                        setEditingBrand({ ...editingBrand, oem_export_format: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HONDA">Honda</SelectItem>
                        <SelectItem value="HUSQVARNA">Husqvarna</SelectItem>
                        <SelectItem value="ECHO">Echo</SelectItem>
                        <SelectItem value="GENERIC">Generic CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={editingBrand?.active ?? true}
                    onCheckedChange={(checked) => 
                      setEditingBrand({ ...editingBrand, active: checked })
                    }
                  />
                  <Label htmlFor="active">Active</Label>
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading brands...</div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No brands yet. Add your first brand to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>OEM Export</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.supplier || '—'}</TableCell>
                  <TableCell>
                    {brand.oem_export_required ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell>{brand.oem_export_format || '—'}</TableCell>
                  <TableCell>
                    <span className={brand.active ? 'text-green-600' : 'text-muted-foreground'}>
                      {brand.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(brand)}
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
