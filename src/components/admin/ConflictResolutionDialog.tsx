import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ConflictResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  onReload: () => void;
  onForceOverwrite: (reason: string) => void;
  conflictDetails?: {
    recordType: string;
    recordId: string;
    expectedVersion: number;
    actualVersion: number;
  };
}

export function ConflictResolutionDialog({
  open,
  onClose,
  onReload,
  onForceOverwrite,
  conflictDetails
}: ConflictResolutionDialogProps) {
  const [overwriteReason, setOverwriteReason] = useState('');
  const [isOverwriting, setIsOverwriting] = useState(false);

  const handleForceOverwrite = async () => {
    if (!overwriteReason.trim()) {
      return;
    }
    
    setIsOverwriting(true);
    try {
      await onForceOverwrite(overwriteReason);
      setOverwriteReason('');
      onClose();
    } finally {
      setIsOverwriting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Data Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This record was modified by another user while you were editing.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            <strong>Conflict Details:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              {conflictDetails && (
                <>
                  <li>Record Type: {conflictDetails.recordType}</li>
                  <li>Your version: {conflictDetails.expectedVersion}</li>
                  <li>Current version: {conflictDetails.actualVersion}</li>
                  <li className="text-sm text-muted-foreground">
                    Someone else saved changes {conflictDetails.actualVersion - conflictDetails.expectedVersion} time(s) since you loaded this record
                  </li>
                </>
              )}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Recommended action:</strong> Reload the record to see the latest changes, then reapply your edits carefully.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overwrite-reason">Force Overwrite (Admin Only)</Label>
            <Textarea
              id="overwrite-reason"
              placeholder="Enter a detailed reason for overwriting (e.g., 'Customer confirmed data on phone call, other version is incorrect')"
              value={overwriteReason}
              onChange={(e) => setOverwriteReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Warning: Force overwrite will discard the other user's changes. This action is logged and audited.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={onReload}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Latest Data
          </Button>
          <Button
            variant="destructive"
            onClick={handleForceOverwrite}
            disabled={!overwriteReason.trim() || isOverwriting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isOverwriting ? 'Overwriting...' : 'Force Overwrite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
