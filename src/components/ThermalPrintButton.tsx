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
  width?: 79 | 58;
}

export function ThermalPrintButton({ 
  job, 
  type, 
  label,
  variant = 'outline',
  size = 'default',
  width
}: ThermalPrintButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [printerWidth, setPrinterWidth] = useState<79 | 58>(width || 79);

  const handlePrint = async () => {
    setOpen(false);
    
    // Debug logging
    console.log('[Thermal Print] Job data:', {
      jobNumber: job.jobNumber,
      machineCategory: job.machineCategory,
      labourHours: job.labourHours,
      labourRate: job.labourRate,
      attachments: job.attachments,
      attachmentCount: job.attachments?.length || 0
    });
    
    try {
      // For Multi-Tool service labels with attachments, print separate labels
      if (
        type === 'service-label' && 
        (job.machineCategory === 'Multi-Tool' || job.machineCategory === 'Battery Multi-Tool')
      ) {
        const attachmentsWithProblems = (job.attachments || []).filter(
          att => att.problemDescription && att.problemDescription.trim() !== ''
        );

        console.log('[Multi-Tool Print] Attachments with problems:', attachmentsWithProblems.length);

        if (attachmentsWithProblems.length > 0) {
          // Print one label per attachment
          for (const attachment of attachmentsWithProblems) {
            const attachmentJob = {
              ...job,
              jobNumber: `${job.jobNumber} • ${attachment.name.toUpperCase()}`,
              problemDescription: attachment.problemDescription,
            };
            
            console.log('[Multi-Tool Print] Printing label for:', attachment.name);
            await printThermal({ job: attachmentJob, type, width: printerWidth });
            
            // Small delay between prints
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          toast({
            title: 'Multi-tool labels sent',
            description: `${attachmentsWithProblems.length} labels sent to printer`
          });
          return;
        } else {
          console.log('[Multi-Tool Print] No attachments with problems - printing standard label');
        }
      }

      // Standard single label print
      console.log('[Thermal Print] Printing standard label');
      await printThermal({ job, type, width: printerWidth });
      toast({
        title: 'Print sent',
        description: `${type === 'service-label' ? 'Service label' : 'Collection receipt'} sent to printer`
      });
    } catch (error) {
      console.error('[Thermal Print] Error:', error);
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
              <Select value={String(printerWidth)} onValueChange={(v) => setPrinterWidth(Number(v) as 79 | 58)}>
                <SelectTrigger id="width">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="79">79mm (Epson TM-T82II)</SelectItem>
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
