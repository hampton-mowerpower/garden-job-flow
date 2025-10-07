import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Job } from '@/types/job';
import { Printer } from 'lucide-react';
import { printThermal } from './ThermalPrint';
import { printMultiToolLabels } from './booking/MultiToolLabelPrinter';
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

  const isMultiTool = job.machineCategory === 'Multi-Tool' || job.machineCategory === 'Battery Multi-Tool';
  const hasMultiToolAttachments = isMultiTool && (job.attachments || []).some(att => 
    att.problemDescription && att.problemDescription.trim() !== ''
  );

  const handleConfirm = async () => {
    // Close dialog immediately, don't wait for printing
    onOpenChange(false);
    onComplete();
    
    // Print in background without blocking
    if (printServiceLabel) {
      // For Multi-Tool with attachments, print one label per attachment
      if (hasMultiToolAttachments) {
        printMultiToolLabels(job)
          .then(() => {
            toast({
              title: 'Multi-Tool Labels Sent',
              description: `${(job.attachments || []).filter(att => att.problemDescription).length} service labels sent to printer`
            });
          })
          .catch((error) => {
            console.error('Multi-tool label print error:', error);
            toast({
              title: 'Label Print Failed',
              description: error.message || 'Failed to print service labels',
              variant: 'destructive'
            });
          });
      } else {
        // Standard single label
        printThermal({ job, type: 'service-label', width: 79 })
          .then(() => {
            toast({
              title: 'Service Label Sent',
              description: 'Service label sent to printer'
            });
          })
          .catch((error) => {
            console.error('Service label print error:', error);
            toast({
              title: 'Service Label Failed',
              description: 'Failed to print service label',
              variant: 'destructive'
            });
          });
      }
    }

    if (printCollectionReceipt) {
      printThermal({ job, type: 'collection-receipt', width: 79 })
        .then(() => {
          toast({
            title: 'Collection Receipt Sent',
            description: 'Collection receipt sent to printer'
          });
        })
        .catch((error) => {
          console.error('Collection receipt print error:', error);
          toast({
            title: 'Collection Receipt Failed',
            description: 'Failed to print collection receipt',
            variant: 'destructive'
          });
        });
    }

    if (!printServiceLabel && !printCollectionReceipt) {
      toast({
        title: 'Saved',
        description: 'Job saved successfully'
      });
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
              {hasMultiToolAttachments 
                ? `Print Service Labels (${(job.attachments || []).filter(att => att.problemDescription).length} labels for attachments)`
                : 'Print Service Label (79mm thermal)'}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="print-collection-receipt"
              checked={printCollectionReceipt}
              onCheckedChange={(checked) => setPrintCollectionReceipt(checked as boolean)}
            />
            <Label htmlFor="print-collection-receipt" className="cursor-pointer">
              Print Collection Receipt (79mm thermal)
            </Label>
          </div>

          <div className="text-sm text-muted-foreground mt-4">
            <p>• Job: <strong>{job.jobNumber}</strong></p>
            <p>• Customer: <strong>{job.customer.name}</strong></p>
            <p>• Printer: <strong>Epson TM-T82II</strong></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleConfirm}>
            <Printer className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
