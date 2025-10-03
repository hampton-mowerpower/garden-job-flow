import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { Job } from '@/types/job';
import { printThermal } from './ThermalPrint';
import { useToast } from '@/hooks/use-toast';

interface ThermalPrintButtonProps {
  job: Job;
  type: 'service-label' | 'collection-receipt';
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ThermalPrintButton({ 
  job, 
  type, 
  label, 
  variant = 'outline',
  size = 'default'
}: ThermalPrintButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState<80 | 58>(80);

  const handlePrint = async () => {
    setOpen(false);
    try {
      await printThermal({ job, type, width });
      toast({
        title: 'Print sent',
        description: `${type === 'service-label' ? 'Service label' : 'Collection receipt'} sent to printer`
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: 'Print failed',
        description: 'Failed to print. Please check your printer connection.',
        variant: 'destructive'
      });
    }
  };

  const defaultLabel = type === 'service-label' ? 'Service Label' : 'Collection Receipt';

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        {label || defaultLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Print {type === 'service-label' ? 'Service Label' : 'Collection Receipt'}
            </DialogTitle>
            <DialogDescription>
              Select thermal printer width and confirm printing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="width">Thermal Printer Width</Label>
              <Select value={String(width)} onValueChange={(v) => setWidth(Number(v) as 80 | 58)}>
                <SelectTrigger id="width">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80mm (Standard)</SelectItem>
                  <SelectItem value="58">58mm (Compact)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Job: <strong>{job.jobNumber}</strong></p>
              <p>• Customer: <strong>{job.customer.name}</strong></p>
              <p>• Printer: <strong>Epson TM-T82II</strong></p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
