import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  fieldName: string;
  oldValue: any;
  newValue: any;
  tableName: string;
}

export function ProtectedFieldDialog({
  open,
  onClose,
  onConfirm,
  fieldName,
  oldValue,
  newValue,
  tableName
}: ProtectedFieldDialogProps) {
  const [changeReason, setChangeReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!changeReason.trim()) {
      return;
    }
    
    setIsConfirming(true);
    try {
      await onConfirm(changeReason);
      setChangeReason('');
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Protected Field Change
          </DialogTitle>
          <DialogDescription>
            You are modifying a protected field that requires authorization and justification.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This field is protected because changes can significantly impact
            data integrity, financial records, or customer relationships.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Table:</span>{' '}
              <code className="px-1 py-0.5 bg-background rounded">{tableName}</code>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Field:</span>{' '}
              <code className="px-1 py-0.5 bg-background rounded">{fieldName}</code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-destructive">Current Value</Label>
              <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
                {formatValue(oldValue)}
              </div>
            </div>
            <div>
              <Label className="text-green-600">New Value</Label>
              <div className="mt-1 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm">
                {formatValue(newValue)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-reason">
              Justification for Change *
            </Label>
            <Textarea
              id="change-reason"
              placeholder="Provide a detailed reason for this change (e.g., 'Customer confirmed via phone call on 2025-10-15 that their correct phone number is...')"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This justification will be permanently recorded in the audit log and associated with your user account.
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Audit Trail:</strong> This change will be logged with your user ID, timestamp,
              old/new values, and the justification you provide. Admin users can review all
              protected field changes in the audit dashboard.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!changeReason.trim() || isConfirming}
          >
            {isConfirming ? 'Confirming...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
