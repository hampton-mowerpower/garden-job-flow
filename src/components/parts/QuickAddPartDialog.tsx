import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { z } from 'zod';

const CATEGORIES = [
  'Engine',
  'Fluids',
  'Cutting',
  'Drive System',
  'Hardware',
  'Electrical',
  'Hydraulics',
  'Transmission',
  'Filters',
  'Belts & Hoses',
  'Tools',
  'Multi-Tool',
  'Other'
];

const partSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  base_price: z.number().min(0, 'Base price must be positive'),
  sell_price: z.number().min(0, 'Sell price must be positive'),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
});

interface QuickAddPartDialogProps {
  onPartAdded: () => void;
  trigger?: React.ReactNode;
}

export function QuickAddPartDialog({ onPartAdded, trigger }: QuickAddPartDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    base_price: '',
    sell_price: '',
    markup: '',
    stock_quantity: '0',
    min_stock: '0',
    supplier: '',
    description: '',
    include_gst: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const calculateSellPrice = () => {
    const basePrice = parseFloat(formData.base_price) || 0;
    const markup = parseFloat(formData.markup) || 0;
    const sellPrice = basePrice * (1 + markup / 100);
    
    if (formData.include_gst) {
      return (sellPrice * 1.1).toFixed(2);
    }
    return sellPrice.toFixed(2);
  };

  const handleMarginChange = (value: string) => {
    setFormData({ ...formData, markup: value });
    if (formData.base_price) {
      const calculated = calculateSellPrice();
      setFormData(prev => ({ ...prev, sell_price: calculated }));
    }
  };

  const handleBasePriceChange = (value: string) => {
    setFormData({ ...formData, base_price: value });
    if (formData.markup) {
      const calculated = calculateSellPrice();
      setFormData(prev => ({ ...prev, sell_price: calculated }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate
      const validated = partSchema.parse({
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        sell_price: parseFloat(formData.sell_price),
        stock_quantity: parseInt(formData.stock_quantity)
      });

      // Check for duplicate SKU
      const { data: existing } = await supabase
        .from('parts_catalogue')
        .select('id')
        .eq('sku', validated.sku)
        .maybeSingle();

      if (existing) {
        setErrors({ sku: 'SKU already exists' });
        setLoading(false);
        return;
      }

      // Insert
      const { error } = await supabase
        .from('parts_catalogue')
        .insert([{
          sku: validated.sku,
          name: validated.name,
          category: validated.category,
          base_price: validated.base_price,
          sell_price: validated.sell_price,
          stock_quantity: validated.stock_quantity,
          markup: formData.markup ? parseFloat(formData.markup) : null,
          supplier: formData.supplier || null,
          description: formData.description || null,
          in_stock: validated.stock_quantity > 0
        }]);

      if (error) throw error;

      toast({
        title: "Part added",
        description: "New part has been added successfully."
      });

      // Reset form
      setFormData({
        sku: '',
        name: '',
        category: '',
        base_price: '',
        sell_price: '',
        markup: '',
        stock_quantity: '0',
        min_stock: '0',
        supplier: '',
        description: '',
        include_gst: true
      });
      
      setOpen(false);
      onPartAdded();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Part
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Part</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && <p className="text-xs text-destructive mt-1">{errors.sku}</p>}
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>
            <div className="col-span-2">
              <Label htmlFor="name">Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="base_price">Cost Price *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => handleBasePriceChange(e.target.value)}
                className={errors.base_price ? 'border-destructive' : ''}
              />
              {errors.base_price && <p className="text-xs text-destructive mt-1">{errors.base_price}</p>}
            </div>
            <div>
              <Label htmlFor="markup">Markup % *</Label>
              <Input
                id="markup"
                type="number"
                step="0.1"
                value={formData.markup}
                onChange={(e) => handleMarginChange(e.target.value)}
                placeholder="e.g. 20"
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
                className={errors.sell_price ? 'border-destructive' : ''}
              />
              {errors.sell_price && <p className="text-xs text-destructive mt-1">{errors.sell_price}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include_gst"
                checked={formData.include_gst}
                onCheckedChange={(checked) => setFormData({ ...formData, include_gst: checked })}
              />
              <Label htmlFor="include_gst">Include GST (10%)</Label>
            </div>
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className={errors.stock_quantity ? 'border-destructive' : ''}
              />
              {errors.stock_quantity && <p className="text-xs text-destructive mt-1">{errors.stock_quantity}</p>}
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Notes/Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Part'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
