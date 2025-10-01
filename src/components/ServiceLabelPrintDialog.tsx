import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { Job } from '@/types/job';

interface ServiceLabelPrintDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (quantity: number, template: 'thermal-large' | 'thermal-small' | 'a4') => void;
}

export const ServiceLabelPrintDialog: React.FC<ServiceLabelPrintDialogProps> = ({
  job,
  open,
  onOpenChange,
  onPrint,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [template, setTemplate] = useState<'thermal-large' | 'thermal-small' | 'a4'>('thermal-large');

  const handlePrint = () => {
    onPrint(quantity, template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Service Label?
          </DialogTitle>
          <DialogDescription>
            Print service label for Job {job.jobNumber} - {job.customer.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thermal-large">Thermal (62×100mm)</SelectItem>
                <SelectItem value="thermal-small">Thermal (58×40mm)</SelectItem>
                <SelectItem value="a4">A4 Sticker Sheet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            No, Skip
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Yes, Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
