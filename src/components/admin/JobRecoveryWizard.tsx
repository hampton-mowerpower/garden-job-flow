import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { History, AlertTriangle, CheckCircle, Undo, Save } from 'lucide-react';

interface JobRecoveryWizardProps {
  open: boolean;
  onClose: () => void;
  jobNumber: string;
  jobId: string;
}

interface RecoveryData {
  parts: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  labour_hours?: number;
  labour_rate?: number;
  discount_value?: number;
  discount_type?: string;
  notes?: string;
}

export function JobRecoveryWizard({ open, onClose, jobNumber, jobId }: JobRecoveryWizardProps) {
  const [step, setStep] = useState<'input' | 'review' | 'applied'>('input');
  const [recoveryData, setRecoveryData] = useState<RecoveryData>({ parts: [] });
  const [recoveryReason, setRecoveryReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [computedTotals, setComputedTotals] = useState<any>(null);
  const [stagingId, setStagingId] = useState<string | null>(null);

  const addPart = () => {
    setRecoveryData({
      ...recoveryData,
      parts: [
        ...recoveryData.parts,
        { description: '', quantity: 1, unit_price: 0, total_price: 0 }
      ]
    });
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...recoveryData.parts];
    newParts[index] = { ...newParts[index], [field]: value };
    
    // Auto-calculate total_price
    if (field === 'quantity' || field === 'unit_price') {
      newParts[index].total_price = newParts[index].quantity * newParts[index].unit_price;
    }
    
    setRecoveryData({ ...recoveryData, parts: newParts });
  };

  const removePart = (index: number) => {
    setRecoveryData({
      ...recoveryData,
      parts: recoveryData.parts.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const partsSubtotal = recoveryData.parts.reduce((sum, part) => sum + part.total_price, 0);
    const labourTotal = (recoveryData.labour_hours || 0) * (recoveryData.labour_rate || 0);
    const subtotal = partsSubtotal + labourTotal;
    const discountAmount = recoveryData.discount_type === 'percentage' 
      ? subtotal * ((recoveryData.discount_value || 0) / 100)
      : (recoveryData.discount_value || 0);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const gst = subtotalAfterDiscount * 0.1;
    const grandTotal = subtotalAfterDiscount + gst;
    
    return {
      parts_subtotal: partsSubtotal,
      labour_total: labourTotal,
      subtotal,
      discount_amount: discountAmount,
      gst,
      grand_total: grandTotal
    };
  };

  const handleReview = async () => {
    if (!recoveryReason.trim()) {
      toast.error('Recovery reason is required');
      return;
    }
    
    if (recoveryData.parts.length === 0) {
      toast.error('At least one part is required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Stage the recovery
      const { data: staging, error: stagingError } = await supabase
        .from('job_recovery_staging')
        .insert({
          job_id: jobId,
          job_number: jobNumber,
          recovery_data: recoveryData as any,
          recovery_reason: recoveryReason,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        })
        .select()
        .single();
      
      if (stagingError) throw stagingError;
      
      setStagingId(staging.id);
      
      // Get server-computed totals
      const { data: totals, error: totalsError } = await supabase
        .rpc('compute_job_totals', { p_job_id: jobId });
      
      if (totalsError) throw totalsError;
      
      setComputedTotals(totals);
      setStep('review');
    } catch (error: any) {
      console.error('Recovery staging error:', error);
      toast.error(`Failed to stage recovery: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      // Lock the job
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('record_locks').insert({
        table_name: 'jobs_db',
        record_id: jobId,
        locked_by: user.user?.id!,
        lock_reason: `Recovery of ${jobNumber}: ${recoveryReason}`
      });
      
      // Apply parts
      for (const part of recoveryData.parts) {
        await supabase.from('job_parts').insert({
          job_id: jobId,
          description: part.description,
          quantity: part.quantity,
          unit_price: part.unit_price,
          total_price: part.total_price,
          is_custom: true
        });
      }
      
      // Update job fields
      const updates: any = {
        parts_subtotal: computedTotals.parts_subtotal,
        labour_total: computedTotals.labour_total,
        subtotal: computedTotals.subtotal,
        gst: computedTotals.gst,
        grand_total: computedTotals.grand_total,
        balance_due: computedTotals.balance_due
      };
      
      if (recoveryData.labour_hours) updates.labour_hours = recoveryData.labour_hours;
      if (recoveryData.labour_rate) updates.labour_rate = recoveryData.labour_rate;
      if (recoveryData.discount_value) updates.discount_value = recoveryData.discount_value;
      if (recoveryData.discount_type) updates.discount_type = recoveryData.discount_type;
      if (recoveryData.notes) updates.additional_notes = recoveryData.notes;
      
      const { error: updateError } = await supabase
        .from('jobs_db')
        .update(updates)
        .eq('id', jobId);
      
      if (updateError) throw updateError;
      
      // Mark staging as applied
      await supabase
        .from('job_recovery_staging')
        .update({ applied_at: new Date().toISOString() })
        .eq('id', stagingId);
      
      // Unlock the job
      await supabase
        .from('record_locks')
        .delete()
        .eq('table_name', 'jobs_db')
        .eq('record_id', jobId);
      
      setStep('applied');
      toast.success('Recovery applied successfully');
    } catch (error: any) {
      console.error('Recovery application error:', error);
      toast.error(`Failed to apply recovery: ${error.message}`);
      
      // Unlock on error
      await supabase
        .from('record_locks')
        .delete()
        .eq('table_name', 'jobs_db')
        .eq('record_id', jobId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!stagingId) return;
    
    setIsLoading(true);
    try {
      // Lock the job
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('record_locks').insert({
        table_name: 'jobs_db',
        record_id: jobId,
        locked_by: user.user?.id!,
        lock_reason: `Undo recovery of ${jobNumber}`
      });
      
      // Delete recovered parts
      await supabase
        .from('job_parts')
        .delete()
        .eq('job_id', jobId)
        .eq('is_custom', true);
      
      // Reset job totals to zero
      await supabase
        .from('jobs_db')
        .update({
          parts_subtotal: 0,
          labour_total: 0,
          labour_hours: 0,
          subtotal: 0,
          gst: 0,
          grand_total: 0,
          balance_due: 0
        })
        .eq('id', jobId);
      
      // Mark staging as reverted
      await supabase
        .from('job_recovery_staging')
        .update({ reverted_at: new Date().toISOString() })
        .eq('id', stagingId);
      
      // Unlock the job
      await supabase
        .from('record_locks')
        .delete()
        .eq('table_name', 'jobs_db')
        .eq('record_id', jobId);
      
      toast.success('Recovery undone successfully');
      onClose();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast.error(`Failed to undo recovery: ${error.message}`);
      
      // Unlock on error
      await supabase
        .from('record_locks')
        .delete()
        .eq('table_name', 'jobs_db')
        .eq('record_id', jobId);
    } finally {
      setIsLoading(false);
    }
  };

  const clientTotals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Job Recovery Wizard - {jobNumber}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Enter the missing data for this job'}
            {step === 'review' && 'Review and confirm the recovery'}
            {step === 'applied' && 'Recovery completed successfully'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This wizard will recover lost data. All changes are audited and can be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="recovery-reason">Recovery Reason *</Label>
              <Textarea
                id="recovery-reason"
                placeholder="Explain why this recovery is needed (e.g., 'Data lost during system error on 2025-10-14')"
                value={recoveryReason}
                onChange={(e) => setRecoveryReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Parts</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPart}>
                  Add Part
                </Button>
              </div>
              
              {recoveryData.parts.map((part, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Label>Part {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="Description"
                    value={part.description}
                    onChange={(e) => updatePart(index, 'description', e.target.value)}
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => updatePart(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={part.unit_price}
                        onChange={(e) => updatePart(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Total</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={part.total_price}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Labour Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={recoveryData.labour_hours || ''}
                  onChange={(e) => setRecoveryData({ ...recoveryData, labour_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Labour Rate ($/hr)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={recoveryData.labour_rate || ''}
                  onChange={(e) => setRecoveryData({ ...recoveryData, labour_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold">Client-Side Preview (Unverified)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Parts Subtotal:</div>
                <div>${clientTotals.parts_subtotal.toFixed(2)}</div>
                <div>Labour Total:</div>
                <div>${clientTotals.labour_total.toFixed(2)}</div>
                <div>Subtotal:</div>
                <div>${clientTotals.subtotal.toFixed(2)}</div>
                <div>GST (10%):</div>
                <div>${clientTotals.gst.toFixed(2)}</div>
                <div className="font-bold">Grand Total:</div>
                <div className="font-bold">${clientTotals.grand_total.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any additional recovery notes"
                value={recoveryData.notes || ''}
                onChange={(e) => setRecoveryData({ ...recoveryData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 'review' && computedTotals && (
          <div className="space-y-6">
            <Alert variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Server has computed and verified the totals. Review before applying.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold">Server-Computed Totals (Authoritative)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Parts Subtotal:</div>
                <div>${parseFloat(computedTotals.parts_subtotal).toFixed(2)}</div>
                <div>Labour Total:</div>
                <div>${parseFloat(computedTotals.labour_total).toFixed(2)}</div>
                <div>Subtotal:</div>
                <div>${parseFloat(computedTotals.subtotal).toFixed(2)}</div>
                <div>GST (10%):</div>
                <div>${parseFloat(computedTotals.gst).toFixed(2)}</div>
                <div className="font-bold">Grand Total:</div>
                <div className="font-bold">${parseFloat(computedTotals.grand_total).toFixed(2)}</div>
                <div className="font-bold">Balance Due:</div>
                <div className="font-bold">${parseFloat(computedTotals.balance_due).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recovery Summary</Label>
              <div className="text-sm text-muted-foreground">
                <p><strong>Job:</strong> {jobNumber}</p>
                <p><strong>Parts:</strong> {recoveryData.parts.length} items</p>
                <p><strong>Reason:</strong> {recoveryReason}</p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will modify production data. Ensure all values are correct.
                You can undo this operation if needed.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'applied' && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Recovery applied successfully. All changes have been audited.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold">Recovery Complete</h4>
              <p className="text-sm text-muted-foreground">
                Job {jobNumber} has been recovered. You can now close this wizard or undo the recovery if needed.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleReview} disabled={isLoading}>
                {isLoading ? 'Staging...' : 'Review Recovery'}
              </Button>
            </>
          )}
          
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Applying...' : 'Apply Recovery'}
              </Button>
            </>
          )}
          
          {step === 'applied' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="destructive" onClick={handleUndo} disabled={isLoading}>
                <Undo className="h-4 w-4 mr-2" />
                {isLoading ? 'Undoing...' : 'Undo Recovery'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
