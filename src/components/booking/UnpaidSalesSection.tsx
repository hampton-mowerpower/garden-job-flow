import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { JobSalesItem } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { InputCurrency } from '@/components/ui/input-currency';

interface UnpaidSalesSectionProps {
  salesItems: JobSalesItem[];
  collectWithJob: boolean;
  onChange: (salesItems: JobSalesItem[], collectWithJob: boolean) => void;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const UnpaidSalesSection: React.FC<UnpaidSalesSectionProps> = ({
  salesItems,
  collectWithJob,
  onChange
}) => {
  const [localItems, setLocalItems] = useState<JobSalesItem[]>(salesItems);
  const [localCollectWithJob, setLocalCollectWithJob] = useState(collectWithJob);

  // Sync local state with props
  useEffect(() => {
    setLocalItems(salesItems);
  }, [salesItems]);

  useEffect(() => {
    setLocalCollectWithJob(collectWithJob);
  }, [collectWithJob]);

  const handleAddItem = () => {
    const newItem: JobSalesItem = {
      id: generateTempId(),
      description: '',
      category: 'parts',
      amount: 0,
      notes: '',
      collect_with_job: localCollectWithJob,
      paid_status: 'unpaid'
    };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onChange(updated, localCollectWithJob);
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    onChange(updated, localCollectWithJob);
  };

  const handleUpdateItem = (index: number, field: keyof JobSalesItem, value: any) => {
    const updated = localItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    onChange(updated, localCollectWithJob);
  };

  const handleCollectWithJobChange = (checked: boolean) => {
    setLocalCollectWithJob(checked);
    // Update all items to reflect this setting
    const updated = localItems.map(item => ({ ...item, collect_with_job: checked }));
    setLocalItems(updated);
    onChange(updated, checked);
  };

  const totalUnpaidSales = localItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'new_mower': return 'New Mower';
      case 'parts': return 'Parts';
      case 'accessories': return 'Accessories';
      case 'other': return 'Other';
      default: return category;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Unpaid Sales
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track items sold but not yet paid - payment can be collected with this job
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleAddItem}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sale Item
        </Button>

        {localItems.length > 0 && (
          <div className="space-y-4">
            {localItems.map((item, index) => (
              <Card key={item.id || index} className="border-2">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid gap-3">
                    {/* Description */}
                    <div>
                      <Label htmlFor={`sale-desc-${index}`}>
                        Item Description <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`sale-desc-${index}`}
                        placeholder="e.g., Honda HRU196 Mower, Spark Plug x2"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <Label htmlFor={`sale-category-${index}`}>
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => handleUpdateItem(index, 'category', value)}
                      >
                        <SelectTrigger id={`sale-category-${index}`} className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_mower">New Mower</SelectItem>
                          <SelectItem value="parts">Parts</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor={`sale-amount-${index}`}>
                        Amount <span className="text-destructive">*</span>
                      </Label>
                      <InputCurrency
                        id={`sale-amount-${index}`}
                        value={item.amount}
                        onChange={(value) => handleUpdateItem(index, 'amount', value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor={`sale-notes-${index}`}>Notes (Optional)</Label>
                      <Textarea
                        id={`sale-notes-${index}`}
                        placeholder="Additional details about this sale..."
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Total Display */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-semibold">Total Unpaid Sales:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalUnpaidSales)}
              </span>
            </div>

            {/* Collect with Job Checkbox */}
            <div className="flex items-start space-x-2 p-4 border rounded-lg">
              <Checkbox
                id="collect-with-job"
                checked={localCollectWithJob}
                onCheckedChange={handleCollectWithJobChange}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="collect-with-job"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Collect payment with this job
                </label>
                <p className="text-sm text-muted-foreground">
                  Include unpaid sales in job total and collect payment when job is completed
                </p>
              </div>
            </div>
          </div>
        )}

        {localItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No sale items added yet. Click "Add Sale Item" to track items sold to the customer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};