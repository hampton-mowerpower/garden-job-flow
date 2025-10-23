import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

interface CustomerChangeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  jobNumber: string;
  oldCustomer: CustomerData;
  newCustomer: CustomerData;
  hasPayments?: boolean;
  hasInvoice?: boolean;
  isCompleted?: boolean;
}

export function CustomerChangeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  jobNumber,
  oldCustomer,
  newCustomer,
  hasPayments = false,
  hasInvoice = false,
  isCompleted = false,
}: CustomerChangeConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    console.log('[CustomerChangeDialog] Auto-accepting customer change');
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm();
      // Only close dialog after successful save
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to save customer change:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setError(null);
      onOpenChange(false);
    }
  };

  const showWarnings = hasPayments || hasInvoice || isCompleted;

  // Auto-accept without showing dialog for smooth save flow
  React.useEffect(() => {
    if (open && !isLoading) {
      console.log('[CustomerChangeDialog] Auto-confirming without user interaction');
      handleConfirm();
    }
  }, [open]);
  
  return (
    <AlertDialog open={false}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Change Customer Information?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-foreground">
                You are about to change the customer for:{' '}
                <span className="font-semibold">{jobNumber}</span>
              </p>

              <div className="grid gap-4 rounded-lg border bg-muted/50 p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    FROM (Current):
                  </h4>
                  <div className="space-y-1 pl-4">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">→ Customer:</span>{' '}
                      <span className="font-medium">{oldCustomer.name}</span>
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">→ Phone:</span>{' '}
                      <span className="font-medium">{oldCustomer.phone}</span>
                    </p>
                    {oldCustomer.email && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">→ Email:</span>{' '}
                        <span className="font-medium">{oldCustomer.email}</span>
                      </p>
                    )}
                    {oldCustomer.company && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">→ Company:</span>{' '}
                        <span className="font-medium">{oldCustomer.company}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    TO (New):
                  </h4>
                  <div className="space-y-1 pl-4">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">→ Customer:</span>{' '}
                      <span className="font-medium text-primary">{newCustomer.name}</span>
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">→ Phone:</span>{' '}
                      <span className="font-medium text-primary">{newCustomer.phone}</span>
                    </p>
                    {newCustomer.email && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">→ Email:</span>{' '}
                        <span className="font-medium text-primary">{newCustomer.email}</span>
                      </p>
                    )}
                    {newCustomer.company && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">→ Company:</span>{' '}
                        <span className="font-medium text-primary">{newCustomer.company}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {showWarnings && (
                <div className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                  <h4 className="font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings:
                  </h4>
                  <ul className="space-y-1 pl-6 text-sm">
                    {hasPayments && (
                      <li className="text-amber-700 dark:text-amber-400">
                        • This job has payments recorded. Changing the customer may cause billing confusion.
                      </li>
                    )}
                    {hasInvoice && (
                      <li className="text-amber-700 dark:text-amber-400">
                        • An invoice has been sent for this job. Changing the customer will NOT update the sent invoice.
                      </li>
                    )}
                    {isCompleted && (
                      <li className="text-amber-700 dark:text-amber-400">
                        • This job is marked as completed. Customer changes should only be done to correct errors.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                <p className="font-semibold text-primary">
                  This will update THIS JOB ONLY.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  No other jobs will be affected by this change.
                </p>
              </div>

              <p className="text-muted-foreground text-sm">
                Are you sure you want to change the customer?
              </p>

              {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <p className="text-sm text-destructive font-semibold">
                    ❌ {error}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Yes, Change Customer'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
