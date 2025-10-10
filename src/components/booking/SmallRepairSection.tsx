import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InputCurrency } from '@/components/ui/input-currency';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Wrench, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface SmallRepairData {
  repairDetails: string;
  minutes: number;
  rateType: 'per_min' | 'per_hr';
  rate: number;
  calculatedTotal: number;
  overrideTotal: number | undefined;
  includeInTotals: boolean;
}

interface SmallRepairSectionProps {
  data: SmallRepairData;
  onChange: (data: SmallRepairData) => void;
}

export const SmallRepairSection: React.FC<SmallRepairSectionProps> = ({ data, onChange }) => {
  const [localData, setLocalData] = useState<SmallRepairData>(data);

  // Calculate total whenever inputs change
  useEffect(() => {
    const total = calculateLabourTotal(localData.minutes, localData.rate, localData.rateType);
    const updated = { ...localData, calculatedTotal: total };
    setLocalData(updated);
    onChange(updated);
  }, [localData.minutes, localData.rate, localData.rateType]);

  const calculateLabourTotal = (minutes: number, rate: number, rateType: 'per_min' | 'per_hr'): number => {
    if (!minutes || !rate) return 0;
    
    if (rateType === 'per_hr') {
      return (minutes / 60) * rate;
    }
    return minutes * rate;
  };

  const handleFieldChange = (field: keyof SmallRepairData, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const finalTotal = localData.overrideTotal !== undefined && localData.overrideTotal !== null
    ? localData.overrideTotal
    : localData.calculatedTotal;

  const handleClear = () => {
    const clearedData = {
      repairDetails: '',
      minutes: 0,
      rateType: 'per_hr' as 'per_min' | 'per_hr',
      rate: 100,
      calculatedTotal: 0,
      overrideTotal: undefined,
      includeInTotals: false
    };
    setLocalData(clearedData);
    onChange(clearedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Small Repair
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repair Details */}
        <div>
          <Label htmlFor="repair-details">Repair Details</Label>
          <Textarea
            id="repair-details"
            placeholder="Describe the small repair work performed..."
            value={localData.repairDetails}
            onChange={(e) => handleFieldChange('repairDetails', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Labour Time */}
          <div>
            <Label htmlFor="labour-minutes">Labour Time (minutes)</Label>
            <Input
              id="labour-minutes"
              type="number"
              min="0"
              step="1"
              value={localData.minutes || ''}
              onChange={(e) => handleFieldChange('minutes', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Rate Type */}
          <div>
            <Label htmlFor="rate-type">Rate Type</Label>
            <Select
              value={localData.rateType}
              onValueChange={(value: 'per_min' | 'per_hr') => handleFieldChange('rateType', value)}
            >
              <SelectTrigger id="rate-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_hr">Per Hour</SelectItem>
                <SelectItem value="per_min">Per Minute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rate */}
          <div>
            <Label htmlFor="labour-rate">
              Rate ({localData.rateType === 'per_hr' ? '$/hr' : '$/min'})
            </Label>
            <InputCurrency
              id="labour-rate"
              value={localData.rate || 0}
              onChange={(value) => handleFieldChange('rate', value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Calculated Total */}
        <div className="bg-muted p-3 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Calculated Labour Total:</span>
            <span className="text-lg font-bold">{formatCurrency(localData.calculatedTotal)}</span>
          </div>
        </div>

        {/* Override Total */}
        <div>
          <Label htmlFor="override-total">Fixed Labour Override (optional)</Label>
          <InputCurrency
            id="override-total"
            value={localData.overrideTotal || 0}
            onChange={(value) => handleFieldChange('overrideTotal', value || undefined)}
            placeholder="Leave empty to use calculated total"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Override the calculated total with a fixed amount
          </p>
        </div>

        {/* Include in Totals Toggle */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-1">
            <Label htmlFor="include-totals" className="text-base">
              Add Labour to Totals
            </Label>
            <p className="text-sm text-muted-foreground">
              Include {formatCurrency(finalTotal)} in job totals
            </p>
          </div>
          <Switch
            id="include-totals"
            checked={localData.includeInTotals}
            onCheckedChange={(checked) => handleFieldChange('includeInTotals', checked)}
          />
        </div>

        {localData.includeInTotals && finalTotal > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
            <p className="text-sm font-medium">
              ✓ Labour total of {formatCurrency(finalTotal)} will be included in job totals
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
