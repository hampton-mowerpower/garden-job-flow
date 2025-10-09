import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/types/job';
import { Mail, Send, Paperclip, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmailNotificationDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EmailTemplate = 'quotation' | 'service-reminder' | 'completion-reminder' | 'completion';

const EMAIL_TEMPLATES: Record<EmailTemplate, { label: string; hasAttachment: boolean }> = {
  'quotation': { label: 'Quotation (with quote PDF)', hasAttachment: true },
  'service-reminder': { label: 'Service Reminder', hasAttachment: false },
  'completion-reminder': { label: 'Job Completion Reminder', hasAttachment: false },
  'completion': { label: 'Job Completion (with invoice PDF)', hasAttachment: true }
};

export function EmailNotificationDialog({ job, open, onOpenChange }: EmailNotificationDialogProps) {
  const { toast } = useToast();
  const [template, setTemplate] = useState<EmailTemplate>('quotation');
  const [recipient, setRecipient] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      setRecipient(job.customer.email || '');
      updateTemplateContent(template);
    }
  }, [open, template, job]);

  const updateTemplateContent = (templateType: EmailTemplate) => {
    const hasCosting = job.grandTotal > 0;
    
    switch (templateType) {
      case 'quotation':
        setSubject(`Quotation for Job #${job.jobNumber} - Hampton Mowerpower`);
        setMessage(
          `Dear ${job.customer.name},\n\n` +
          `Please find attached the quotation for your ${job.machineBrand} ${job.machineModel} service (Job #${job.jobNumber}).\n\n` +
          (hasCosting 
            ? `Estimated Total: $${job.grandTotal.toFixed(2)} (inc. GST)\n\n`
            : `We are preparing your quotation and will update you shortly.\n\n`) +
          `If you have any questions or would like to proceed, please don't hesitate to contact us.\n\n` +
          `Best regards,\nHampton Mowerpower Team`
        );
        break;
      case 'service-reminder':
        setSubject(`Service Reminder for Job #${job.jobNumber} - Hampton Mowerpower`);
        setMessage(
          `Dear ${job.customer.name},\n\n` +
          `This is a friendly reminder about your ${job.machineBrand} ${job.machineModel} service (Job #${job.jobNumber}).\n\n` +
          `Current Status: ${job.status.replace('-', ' ').toUpperCase()}\n\n` +
          `Please contact us if you have any questions.\n\n` +
          `Best regards,\nHampton Mowerpower Team`
        );
        break;
      case 'completion-reminder':
        setSubject(`Your Equipment is Almost Ready - Job #${job.jobNumber}`);
        setMessage(
          `Dear ${job.customer.name},\n\n` +
          `We wanted to let you know that your ${job.machineBrand} ${job.machineModel} service (Job #${job.jobNumber}) is nearing completion.\n\n` +
          `We will notify you as soon as it's ready for collection.\n\n` +
          `Best regards,\nHampton Mowerpower Team`
        );
        break;
      case 'completion':
        setSubject(`Your Equipment is Ready for Collection - Job #${job.jobNumber}`);
        setMessage(
          `Dear ${job.customer.name},\n\n` +
          `Great news! Your ${job.machineBrand} ${job.machineModel} service (Job #${job.jobNumber}) has been completed.\n\n` +
          (hasCosting 
            ? `Total: $${job.grandTotal.toFixed(2)} (inc. GST)\n` +
              (job.serviceDeposit > 0 ? `Deposit Paid: $${job.serviceDeposit.toFixed(2)}\n` : '') +
              `Balance Due: $${job.balanceDue.toFixed(2)}\n\n`
            : '') +
          `Your equipment is ready for collection at:\n` +
          `Hampton Mowerpower\n` +
          `87 Ludstone Street, Hampton VIC 3188\n\n` +
          `Please find attached the invoice for your records.\n\n` +
          `Best regards,\nHampton Mowerpower Team`
        );
        break;
    }
  };

  const handleSend = async () => {
    // Validation
    if (!recipient.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a recipient email address',
        variant: 'destructive'
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both subject and message',
        variant: 'destructive'
      });
      return;
    }

    const templateInfo = EMAIL_TEMPLATES[template];
    
    // Check if attachment is required but job has no costs
    if (templateInfo.hasAttachment && job.grandTotal === 0) {
      toast({
        title: 'Cannot Send',
        description: 'This template requires costs to be filled before sending',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    setIsGeneratingPdf(templateInfo.hasAttachment);

    try {
      // Call edge function to send email with attachment
      const { data, error } = await supabase.functions.invoke('send-email-with-attachment', {
        body: {
          jobId: job.id,
          jobNumber: job.jobNumber,
          template,
          recipient: recipient.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          jobData: {
            customerName: job.customer.name,
            customerEmail: job.customer.email,
            customerPhone: job.customer.phone,
            customerAddress: job.customer.address,
            companyName: job.customer.companyName,
            companyAbn: job.customer.companyAbn,
            machineBrand: job.machineBrand,
            machineModel: job.machineModel,
            machineSerial: job.machineSerial,
            machineCategory: job.machineCategory,
            status: job.status,
            grandTotal: job.grandTotal,
            serviceDeposit: job.serviceDeposit,
            balanceDue: job.balanceDue,
            parts: job.parts,
            labourHours: job.labourHours,
            labourRate: job.labourRate,
            gst: job.gst,
            transportTotalCharge: job.transportTotalCharge,
            transportBreakdown: job.transportBreakdown,
            sharpenTotalCharge: job.sharpenTotalCharge,
            sharpenBreakdown: job.sharpenBreakdown,
            smallRepairTotal: job.smallRepairTotal,
            smallRepairDetails: job.smallRepairDetails,
            problemDescription: job.problemDescription,
            additionalNotes: job.additionalNotes,
            requestedFinishDate: job.requestedFinishDate ? job.requestedFinishDate.toString() : undefined
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Email Sent',
        description: `Email sent successfully to ${recipient}${templateInfo.hasAttachment ? ' with attachment' : ''}`
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
      setIsGeneratingPdf(false);
    }
  };

  const templateInfo = EMAIL_TEMPLATES[template];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email Notification</DialogTitle>
          <DialogDescription>
            Job #{job.jobNumber} - {job.customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={template} onValueChange={(value: EmailTemplate) => setTemplate(value)}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([key, { label, hasAttachment }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {hasAttachment && <Paperclip className="h-3 w-3" />}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateInfo.hasAttachment && (
              <Badge variant="secondary" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {template === 'quotation' ? 'Quotation PDF' : 'Invoice PDF'} will be auto-attached
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient *</Label>
            <Input
              id="recipient"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cc">CC</Label>
              <Input
                id="cc"
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="optional@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bcc">BCC</Label>
              <Input
                id="bcc"
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="optional@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
              className="resize-none font-mono text-sm"
            />
          </div>

          {templateInfo.hasAttachment && job.grandTotal === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This job has no costs filled. Please add parts/labour before sending.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                )}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
