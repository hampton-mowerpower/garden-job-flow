import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Mail, Send, Tag, Receipt, Loader2 } from 'lucide-react';
import { Job } from '@/types/job';
import { useToast } from '@/hooks/use-toast';
import { jobBookingDB } from '@/lib/storage';
import { printInvoice } from '@/components/JobPrintInvoice';
import { printThermal } from '@/components/ThermalPrint';

interface JobRowActionsProps {
  job: Job;
  onNotifyCustomer: (job: Job) => void;
  onSendEmail: (job: Job) => void;
}

export function JobRowActions({ job, onNotifyCustomer, onSendEmail }: JobRowActionsProps) {
  const { toast } = useToast();
  const [printingInvoice, setPrintingInvoice] = useState(false);
  const [printingLabel, setPrintingLabel] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const handlePrintInvoice = async () => {
    try {
      setPrintingInvoice(true);
      
      // Get latest job data
      const latestJob = await jobBookingDB.getJob(job.id);
      if (!latestJob) {
        throw new Error('Job not found');
      }

      await printInvoice(latestJob);

    } catch (error: any) {
      console.error('Error printing invoice:', error);
      toast({
        title: 'Print Error',
        description: error.message || 'Failed to print invoice',
        variant: 'destructive',
      });
    } finally {
      setPrintingInvoice(false);
    }
  };

  const handlePrintLabel = async () => {
    try {
      setPrintingLabel(true);
      
      // Get latest job data
      const latestJob = await jobBookingDB.getJob(job.id);
      if (!latestJob) {
        throw new Error('Job not found');
      }

      // For Multi-Tool service labels with attachments, print separate labels
      if (
        (latestJob.machineCategory === 'Multi-Tool' || latestJob.machineCategory === 'Battery Multi-Tool')
      ) {
        const attachmentsWithProblems = (latestJob.attachments || []).filter(
          att => att.problemDescription && att.problemDescription.trim() !== ''
        );

        if (attachmentsWithProblems.length > 0) {
          // Print one label per attachment
          for (const attachment of attachmentsWithProblems) {
            const attachmentJob = {
              ...latestJob,
              jobNumber: `${latestJob.jobNumber} • ${attachment.name.toUpperCase()}`,
              problemDescription: attachment.problemDescription,
            };
            
            await printThermal({ 
              job: attachmentJob, 
              type: 'service-label', 
              width: 79 
            });
            
            // Small delay between prints
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          toast({
            title: 'Multi-tool labels sent',
            description: `${attachmentsWithProblems.length} labels sent to printer`,
          });
          return;
        }
      }

      // Standard single label print
      await printThermal({
        job: latestJob,
        type: 'service-label',
        width: 79,
      });

      toast({
        title: 'Label sent to printer',
        description: 'Service label sent successfully',
      });

    } catch (error: any) {
      console.error('Error printing label:', error);
      toast({
        title: 'Print Error',
        description: error.message || 'Failed to print service label',
        variant: 'destructive',
      });
    } finally {
      setPrintingLabel(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      setPrintingReceipt(true);
      
      // Get latest job data
      const latestJob = await jobBookingDB.getJob(job.id);
      if (!latestJob) {
        throw new Error('Job not found');
      }

      await printThermal({
        job: latestJob,
        type: 'collection-receipt',
        width: 79,
      });

    } catch (error: any) {
      console.error('Error printing receipt:', error);
      toast({
        title: 'Print Error',
        description: error.message || 'Failed to print collection receipt',
        variant: 'destructive',
      });
    } finally {
      setPrintingReceipt(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* Print Invoice */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrintInvoice}
              disabled={printingInvoice}
              className="h-8 w-8 p-0"
            >
              {printingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print Invoice</TooltipContent>
        </Tooltip>

        {/* Notify Customer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNotifyCustomer(job)}
              className="h-8 w-8 p-0"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notify Customer</TooltipContent>
        </Tooltip>

        {/* Send Email */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendEmail(job)}
              className="h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Email</TooltipContent>
        </Tooltip>

        {/* Service Label */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              title="Coming soon"
              className="h-8 w-8 p-0"
            >
              <Tag className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Service Label (Coming soon)</TooltipContent>
        </Tooltip>

        {/* Collection Receipt */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={true}
              title="Coming soon"
              className="h-8 w-8 p-0"
            >
              <Receipt className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Collection Receipt (Coming soon)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
