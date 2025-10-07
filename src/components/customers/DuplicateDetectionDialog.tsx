import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Merge, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  created_at: string;
}

interface DuplicateDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: Customer[];
  onResolved: () => void;
}

export const DuplicateDetectionDialog: React.FC<DuplicateDetectionDialogProps> = ({
  open,
  onOpenChange,
  duplicates,
  onResolved
}) => {
  const { toast } = useToast();
  const [selectedMasterId, setSelectedMasterId] = useState<string>(duplicates[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMerge = async () => {
    if (!selectedMasterId || duplicates.length < 2) return;

    setIsProcessing(true);

    try {
      const duplicateIds = duplicates.filter(d => d.id !== selectedMasterId).map(d => d.id);
      
      // Get user ID for audit
      const { data: { user } } = await supabase.auth.getUser();
      
      // Start transaction by merging each duplicate
      for (const dupId of duplicateIds) {
        // 1. Repoint all related records - NO customer_id in payments table
        const updates = [
          supabase.from('jobs_db').update({ customer_id: selectedMasterId }).eq('customer_id', dupId),
          supabase.from('invoices').update({ customer_id: selectedMasterId }).eq('customer_id', dupId),
          supabase.from('service_reminders').update({ customer_id: selectedMasterId }).eq('customer_id', dupId)
        ];
        
        await Promise.all(updates);

        // 2. Get duplicate customer data
        const { data: dupCustomer } = await supabase
          .from('customers_db')
          .select('*')
          .eq('id', dupId)
          .single();

        // 3. Mark as deleted and merged
        await supabase
          .from('customers_db')
          .update({
            is_deleted: true,
            merged_into_id: selectedMasterId
          })
          .eq('id', dupId);

        // 4. Create audit log
        await supabase
          .from('customer_audit')
          .insert({
            customer_id: dupId,
            action: 'merged',
            details: {
              merged_into: selectedMasterId,
              old_data: dupCustomer
            },
            created_by: user?.id
          });
      }

      toast({
        title: 'Success',
        description: `Merged ${duplicateIds.length} duplicate(s) into master record`
      });

      onResolved();
      onOpenChange(false);
    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: 'Error',
        description: 'Failed to merge duplicates',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Delete this customer record? This cannot be undone.')) return;

    setIsProcessing(true);

    try {
      // Check if customer has any related records
      const { data: jobs } = await supabase
        .from('jobs_db')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);

      if (jobs && jobs.length > 0) {
        // Soft delete
        await supabase
          .from('customers_db')
          .update({ is_deleted: true })
          .eq('id', customerId);

        toast({
          title: 'Customer Archived',
          description: 'Customer has history and was archived instead of deleted'
        });
      } else {
        // Hard delete
        await supabase
          .from('customers_db')
          .delete()
          .eq('id', customerId);

        toast({
          title: 'Customer Deleted',
          description: 'Customer record permanently deleted'
        });
      }

      // If this was the last duplicate, close dialog
      const remaining = duplicates.filter(d => d.id !== customerId);
      if (remaining.length <= 1) {
        onResolved();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <DialogTitle>Duplicate Customers Found</DialogTitle>
          </div>
          <DialogDescription>
            {duplicates.length} customer records with the same phone/email. Choose a master record to keep, then merge or delete duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {duplicates.map((customer) => (
            <Card key={customer.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="master"
                      value={customer.id}
                      checked={selectedMasterId === customer.id}
                      onChange={() => setSelectedMasterId(customer.id)}
                      className="w-4 h-4"
                    />
                    <label className="font-semibold cursor-pointer" onClick={() => setSelectedMasterId(customer.id)}>
                      {customer.name}
                    </label>
                    {selectedMasterId === customer.id && (
                      <Badge variant="secondary">Master</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    <p><strong>Phone:</strong> {customer.phone}</p>
                    <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                    <p><strong>Created:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedMasterId !== customer.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    disabled={isProcessing}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isProcessing || duplicates.length < 2}
          >
            <Merge className="w-4 h-4 mr-2" />
            {isProcessing ? 'Merging...' : 'Merge Duplicates'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
