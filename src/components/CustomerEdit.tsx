import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  companyName?: string;
  companyAbn?: string;
  companyEmail?: string;
  companyPhone?: string;
  billingAddress?: string;
}

interface CustomerEditProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CustomerEdit({ customer, open, onOpenChange, onSaved }: CustomerEditProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Customer | null>(customer);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!formData) return;

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Customer name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Phone number is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customers_db')
        .update({
          name: toTitleCase(formData.name.trim()),
          phone: formData.phone.trim(),
          email: formData.email?.trim() || null,
          address: formData.address.trim(),
          notes: formData.notes?.trim() || null,
          company_name: formData.companyName?.trim() || null,
          company_abn: formData.companyAbn?.trim() || null,
          company_email: formData.companyEmail?.trim() || null,
          company_phone: formData.companyPhone?.trim() || null,
          billing_address: formData.billingAddress?.trim() || null,
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer updated successfully'
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData) return;

    setIsDeleting(true);
    try {
      // Check if customer has any jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs_db')
        .select('id')
        .eq('customer_id', formData.id)
        .limit(1);

      if (jobsError) throw jobsError;

      if (jobs && jobs.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: 'This customer has existing jobs and cannot be deleted. Consider marking them inactive instead.',
          variant: 'destructive'
        });
        setShowDeleteDialog(false);
        setIsDeleting(false);
        return;
      }

      // If no jobs, safe to hard delete
      const { error: deleteError } = await supabase
        .from('customers_db')
        .delete()
        .eq('id', formData.id);

      if (deleteError) throw deleteError;

      // Log the deletion
      await supabase
        .from('customer_audit')
        .insert({
          action: 'deleted',
          old_customer_id: formData.id,
          details: { name: formData.name, phone: formData.phone }
        });

      toast({
        title: 'Success',
        description: 'Customer deleted successfully'
      });

      onSaved();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!formData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Make changes to customer information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => {
                  const formatted = toTitleCase(e.target.value);
                  if (formatted !== e.target.value) {
                    setFormData({ ...formData, name: formatted });
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Company Details Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Company Details (Optional)</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-company-name">Company Name</Label>
                  <Input
                    id="edit-company-name"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-company-abn">Company ABN</Label>
                  <Input
                    id="edit-company-abn"
                    value={formData.companyAbn || ''}
                    onChange={(e) => setFormData({ ...formData, companyAbn: e.target.value })}
                    placeholder="XX XXX XXX XXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-company-email">Company Email</Label>
                    <Input
                      id="edit-company-email"
                      type="email"
                      value={formData.companyEmail || ''}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-company-phone">Company Phone</Label>
                    <Input
                      id="edit-company-phone"
                      value={formData.companyPhone || ''}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-billing-address">Billing Address</Label>
                  <Textarea
                    id="edit-billing-address"
                    value={formData.billingAddress || ''}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{formData.name}</strong>?
              This action cannot be undone. The customer will only be deleted if they have no existing jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
