import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, X, Plus, Save } from 'lucide-react';

interface AccountEmailRoutingProps {
  accountId: string;
  quotesTo: string[];
  invoicesTo: string[];
  paymentsTo: string[];
  onUpdated: () => void;
}

export function AccountEmailRouting({
  accountId,
  quotesTo,
  invoicesTo,
  paymentsTo,
  onUpdated
}: AccountEmailRoutingProps) {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<string[]>(quotesTo || []);
  const [invoices, setInvoices] = useState<string[]>(invoicesTo || []);
  const [payments, setPayments] = useState<string[]>(paymentsTo || []);
  const [newQuoteEmail, setNewQuoteEmail] = useState('');
  const [newInvoiceEmail, setNewInvoiceEmail] = useState('');
  const [newPaymentEmail, setNewPaymentEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const addEmail = (type: 'quotes' | 'invoices' | 'payments', email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    switch (type) {
      case 'quotes':
        if (!quotes.includes(trimmed)) {
          setQuotes([...quotes, trimmed]);
        }
        setNewQuoteEmail('');
        break;
      case 'invoices':
        if (!invoices.includes(trimmed)) {
          setInvoices([...invoices, trimmed]);
        }
        setNewInvoiceEmail('');
        break;
      case 'payments':
        if (!payments.includes(trimmed)) {
          setPayments([...payments, trimmed]);
        }
        setNewPaymentEmail('');
        break;
    }
  };

  const removeEmail = (type: 'quotes' | 'invoices' | 'payments', email: string) => {
    switch (type) {
      case 'quotes':
        setQuotes(quotes.filter(e => e !== email));
        break;
      case 'invoices':
        setInvoices(invoices.filter(e => e !== email));
        break;
      case 'payments':
        setPayments(payments.filter(e => e !== email));
        break;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          quotes_to: quotes,
          invoices_to: invoices,
          payments_to: payments,
        })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: 'Email Routing Updated',
        description: 'Email preferences have been saved successfully',
      });

      onUpdated();
    } catch (error: any) {
      console.error('Error updating email routing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email routing',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const EmailList = ({
    emails,
    type,
    newEmail,
    setNewEmail,
    label,
    description
  }: {
    emails: string[];
    type: 'quotes' | 'invoices' | 'payments';
    newEmail: string;
    setNewEmail: (val: string) => void;
    label: string;
    description: string;
  }) => (
    <div className="space-y-3">
      <div>
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {emails.map((email) => (
          <Badge key={email} variant="secondary" className="gap-2">
            <Mail className="h-3 w-3" />
            {email}
            <button
              onClick={() => removeEmail(type, email)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {emails.length === 0 && (
          <span className="text-sm text-muted-foreground italic">No emails configured</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addEmail(type, newEmail);
            }
          }}
          placeholder="email@example.com"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addEmail(type, newEmail)}
          disabled={!newEmail.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Routing Preferences
        </CardTitle>
        <CardDescription>
          Configure default email recipients for quotes, invoices, and payment notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <EmailList
          emails={quotes}
          type="quotes"
          newEmail={newQuoteEmail}
          setNewEmail={setNewQuoteEmail}
          label="Quotation Recipients"
          description="These emails will receive quotation documents"
        />

        <EmailList
          emails={invoices}
          type="invoices"
          newEmail={newInvoiceEmail}
          setNewEmail={setNewInvoiceEmail}
          label="Invoice Recipients"
          description="These emails will receive invoices and service completion notices"
        />

        <EmailList
          emails={payments}
          type="payments"
          newEmail={newPaymentEmail}
          setNewEmail={setNewPaymentEmail}
          label="Payment Recipients"
          description="These emails will receive payment requests, receipts, and reminders"
        />

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Email Routing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
