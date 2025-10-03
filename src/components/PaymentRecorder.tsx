import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { jobBookingDB } from '@/lib/storage';
import { DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentRecorderProps {
  jobId: string;
  balanceDue: number;
  onPaymentRecorded: () => void;
}

export default function PaymentRecorder({ jobId, balanceDue, onPaymentRecorded }: PaymentRecorderProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('card');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const gstRate = 0.1; // 10% GST
  const amountNum = parseFloat(amount) || 0;
  const gstComponent = amountNum / (1 + gstRate) * gstRate;

  const handleRecordPayment = async () => {
    if (amountNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      });
      return;
    }

    if (amountNum > balanceDue) {
      toast({
        title: 'Validation Error',
        description: `Payment amount cannot exceed balance due of $${balanceDue.toFixed(2)}`,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await jobBookingDB.savePayment({
        jobId,
        amount: amountNum,
        gstComponent,
        method,
        reference,
        notes
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment of $${amountNum.toFixed(2)} recorded successfully`,
      });

      // Reset form
      setAmount('');
      setMethod('card');
      setReference('');
      setNotes('');
      
      onPaymentRecorded();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Record Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment-amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={balanceDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
            {amountNum > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Includes ${gstComponent.toFixed(2)} GST
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="eftpos">EFTPOS</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="payment-reference">Reference / Transaction ID</Label>
          <Input
            id="payment-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Optional transaction reference"
          />
        </div>

        <div>
          <Label htmlFor="payment-notes">Notes</Label>
          <Textarea
            id="payment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional payment notes"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Balance Due</p>
            <p className="text-2xl font-bold">${balanceDue.toFixed(2)}</p>
          </div>
          <Button 
            onClick={handleRecordPayment} 
            disabled={isLoading || amountNum <= 0}
            size="lg"
          >
            {amountNum >= balanceDue ? 'Clear Balance' : 'Record Payment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
