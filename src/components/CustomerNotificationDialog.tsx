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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/types/job';
import { Mail, MessageSquare, Send } from 'lucide-react';

interface CustomerNotificationDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerNotificationDialog({ job, open, onOpenChange }: CustomerNotificationDialogProps) {
  const { toast } = useToast();
  const [notificationType, setNotificationType] = useState<'email' | 'sms'>('email');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    if (open) {
      // Generate default message based on job details
      const customerFirstName = job.customer.name.split(' ')[0];
      const statusText = job.status.toUpperCase();
      const machineDesc = `${job.machineBrand} ${job.machineModel}`;
      const problemDesc = job.problemDescription || 'Service required';
      
      const defaultMessage = `Dear ${customerFirstName}

This is an update regarding your ${machineDesc} service (Job #${job.jobNumber}).

Current Status: ${statusText}

Reported Issue:
${problemDesc}

We will keep you updated on the progress. Please do not reply to this email. If you have any questions, call us on 03-9598 6741.

Best regards,
Hampton Mowerpower Team`;
      
      setMessage(defaultMessage);
    }
  }, [open, job]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    if (notificationType === 'email' && !job.customer.email) {
      toast({
        title: 'Missing Email',
        description: 'Customer does not have an email address on file',
        variant: 'destructive'
      });
      return;
    }

    if (notificationType === 'sms' && !job.customer.phone) {
      toast({
        title: 'Missing Phone',
        description: 'Customer does not have a phone number on file',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          job_id: job.id,
          template: 'notify-customer',
          to: job.customer.email,
          message: message,
          idempotency_key: `notify-${job.id}-${Date.now()}`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.already_sent) {
        toast({
          title: 'Already Sent',
          description: 'This notification has already been sent to the customer',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Notification Sent',
          description: `Email notification sent successfully to ${job.customer.name}`
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      let errorMessage = error.message || 'Failed to send notification. Please try again.';
      
      // Check for Resend domain verification error
      if (errorMessage.includes('verify a domain') || errorMessage.includes('fonzren@gmail.com')) {
        errorMessage = 'Email domain not verified. Please verify your domain at resend.com/domains before sending emails to customers.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Customer Notification</DialogTitle>
          <DialogDescription>
            Notify {job.customer.name} about job #{job.jobNumber} status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select value={notificationType} onValueChange={(value: 'email' | 'sms') => setNotificationType(value)}>
              <SelectTrigger id="notification-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email {job.customer.email ? `(${job.customer.email})` : '(Not available)'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="sms" disabled>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>SMS (Coming soon)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-info">Customer Information</Label>
            <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
              <div><strong>Name:</strong> {job.customer.name}</div>
              <div><strong>Phone:</strong> {job.customer.phone}</div>
              {job.customer.email && <div><strong>Email:</strong> {job.customer.email}</div>}
              <div><strong>Status:</strong> <span className="capitalize">{job.status}</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Edit the message above to customize the notification
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send {notificationType === 'email' ? 'Email' : 'SMS'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
