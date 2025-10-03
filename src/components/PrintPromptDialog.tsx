import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Job } from '@/types/job';
import { Printer } from 'lucide-react';
import { printThermal } from './ThermalPrint';
import { useToast } from '@/hooks/use-toast';

interface PrintPromptDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function PrintPromptDialog({ job, open, onOpenChange, onComplete }: PrintPromptDialogProps) {
  const { toast } = useToast();
  const [printServiceLabel, setPrintServiceLabel] = useState(false);
  const [printCollectionReceipt, setPrintCollectionReceipt] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleConfirm = async () => {
    setIsPrinting(true);
    
    try {
      if (printServiceLabel) {
        await printThermal({ job, type: 'service-label', width: 80 });
        toast({
          title: 'Service Label Sent',
          description: 'Service label sent to printer'
        });
      }

      if (printCollectionReceipt) {
        await printThermal({ job, type: 'collection-receipt', width: 80 });
        toast({
          title: 'Collection Receipt Sent',
          description: 'Collection receipt sent to printer'
        });
      }

      if (!printServiceLabel && !printCollectionReceipt) {
        toast({
          title: 'Saved',
          description: 'Job saved successfully'
        });
      }

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: 'Print Error',
        description: 'Failed to print. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Now?</DialogTitle>
          <DialogDescription>
            Would you like to print any documents for this job?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="print-service-label"
              checked={printServiceLabel}
              onCheckedChange={(checked) => setPrintServiceLabel(checked as boolean)}
            />
            <Label htmlFor="print-service-label" className="cursor-pointer">
              Print Service Label (80mm thermal)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="print-collection-receipt"
              checked={printCollectionReceipt}
              onCheckedChange={(checked) => setPrintCollectionReceipt(checked as boolean)}
            />
            <Label htmlFor="print-collection-receipt" className="cursor-pointer">
              Print Collection Receipt (80mm thermal)
            </Label>
          </div>

          <div className="text-sm text-muted-foreground mt-4">
            <p>• Job: <strong>{job.jobNumber}</strong></p>
            <p>• Customer: <strong>{job.customer.name}</strong></p>
            <p>• Printer: <strong>Epson TM-T82II</strong></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} disabled={isPrinting}>
            Skip
          </Button>
          <Button onClick={handleConfirm} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? 'Printing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
