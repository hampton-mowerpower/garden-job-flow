import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Undo, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DataRecovery() {
  const queryClient = useQueryClient();
  const [restoreJobId, setRestoreJobId] = useState('');
  const [restoreTimestamp, setRestoreTimestamp] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restorePreview, setRestorePreview] = useState<any>(null);

  const [rebuildJobNumber, setRebuildJobNumber] = useState('');
  const [rebuildLines, setRebuildLines] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [rebuildReason, setRebuildReason] = useState('');

  // Fetch audit history for restore preview
  const previewRestore = async () => {
    if (!restoreJobId || !restoreTimestamp) {
      toast.error('Please enter both job number and timestamp');
      return;
    }

    const { data: job } = await supabase
      .from('jobs_db')
      .select('*')
      .eq('job_number', restoreJobId)
      .single();

    if (!job) {
      toast.error('Job not found');
      return;
    }

    const { data: history } = await supabase
      .from('audit_log')
      .select('*')
      .eq('record_id', job.id)
      .lte('changed_at', new Date(restoreTimestamp).toISOString())
      .order('changed_at', { ascending: false })
      .limit(1);

    if (history && history.length > 0) {
      setRestorePreview({
        current: job,
        restored: history[0].old_values
      });
      setShowRestoreDialog(true);
    } else {
      toast.error('No history found for that timestamp');
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!restorePreview || !restoreReason) {
        throw new Error('Missing restore data or reason');
      }

      const { error } = await supabase
        .from('jobs_db')
        .update({
          ...restorePreview.restored,
          version: restorePreview.current.version + 1
        })
        .eq('id', restorePreview.current.id);

      if (error) throw error;

      // Log the recovery
      await supabase.from('audit_log').insert({
        table_name: 'jobs_db',
        record_id: restorePreview.current.id,
        operation: 'RECOVERY',
        old_values: restorePreview.current,
        new_values: restorePreview.restored,
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        source: `manual_restore: ${restoreReason}`
      });

      return true;
    },
    onSuccess: () => {
      toast.success('Job restored successfully');
      setShowRestoreDialog(false);
      setRestoreJobId('');
      setRestoreTimestamp('');
      setRestoreReason('');
      setRestorePreview(null);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: any) => {
      toast.error(`Restore failed: ${error.message}`);
    }
  });

  const rebuildMutation = useMutation({
    mutationFn: async () => {
      if (!rebuildJobNumber || !rebuildReason) {
        throw new Error('Please fill in job number and reason');
      }

      const { data: job } = await supabase
        .from('jobs_db')
        .select('*')
        .eq('job_number', rebuildJobNumber)
        .single();

      if (!job) throw new Error('Job not found');

      // Calculate totals
      const partsTotal = rebuildLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
      const gst = partsTotal * 0.1;
      const grandTotal = partsTotal + gst;

      // Update job with new totals
      const { error: jobError } = await supabase
        .from('jobs_db')
        .update({
          parts_subtotal: partsTotal,
          gst: gst,
          grand_total: grandTotal,
          balance_due: grandTotal,
          version: job.version + 1
        })
        .eq('id', job.id);

      if (jobError) throw jobError;

      // Insert parts
      for (const line of rebuildLines) {
        if (line.description && line.quantity > 0 && line.price > 0) {
          await supabase.from('job_parts').insert({
            job_id: job.id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.price,
            total_price: line.quantity * line.price,
            is_custom: true
          });
        }
      }

      // Log the rebuild
      await supabase.from('audit_log').insert({
        table_name: 'jobs_db',
        record_id: job.id,
        operation: 'REBUILD',
        old_values: job,
        new_values: { parts_rebuilt: rebuildLines.length, grand_total: grandTotal },
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        source: `manual_rebuild: ${rebuildReason}`
      });

      return true;
    },
    onSuccess: () => {
      toast.success('Job rebuilt successfully');
      setRebuildJobNumber('');
      setRebuildLines([{ description: '', quantity: 1, price: 0 }]);
      setRebuildReason('');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: any) => {
      toast.error(`Rebuild failed: ${error.message}`);
    }
  });

  const addRebuildLine = () => {
    setRebuildLines([...rebuildLines, { description: '', quantity: 1, price: 0 }]);
  };

  const updateRebuildLine = (index: number, field: string, value: any) => {
    const newLines = [...rebuildLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setRebuildLines(newLines);
  };

  const rebuildTotal = rebuildLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const rebuildGST = rebuildTotal * 0.1;
  const rebuildGrandTotal = rebuildTotal + rebuildGST;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Restore from Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Restore a Job from a Time
            </CardTitle>
            <CardDescription>
              Go back to how a job looked at a specific time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job Number</Label>
                <Input
                  placeholder="e.g. JB2025-0028"
                  value={restoreJobId}
                  onChange={(e) => setRestoreJobId(e.target.value)}
                />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={restoreTimestamp}
                  onChange={(e) => setRestoreTimestamp(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={previewRestore}>
              Show Preview
            </Button>
          </CardContent>
        </Card>

        {/* Rebuild Job */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Rebuild a Job (Re-enter Lost Data)
            </CardTitle>
            <CardDescription>
              Manually re-enter parts, prices, and totals for a job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Job Number</Label>
              <Input
                placeholder="e.g. JB2025-0042"
                value={rebuildJobNumber}
                onChange={(e) => setRebuildJobNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Parts & Services</Label>
              {rebuildLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-6"
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateRebuildLine(index, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => updateRebuildLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Price"
                    value={line.price}
                    onChange={(e) => updateRebuildLine(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                  <div className="col-span-2 flex items-center justify-end text-sm font-medium">
                    ${(line.quantity * line.price).toFixed(2)}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRebuildLine}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>

            {/* Running Total */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">${rebuildTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (10%):</span>
                <span className="font-medium">${rebuildGST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${rebuildGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label>Reason for Rebuild</Label>
              <Textarea
                placeholder="e.g., Lost data during system update"
                value={rebuildReason}
                onChange={(e) => setRebuildReason(e.target.value)}
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => rebuildMutation.mutate()}
                  disabled={!rebuildJobNumber || !rebuildReason || rebuildTotal === 0}
                >
                  Save Rebuilt Job
                </Button>
              </TooltipTrigger>
              <TooltipContent>This will update the job with new parts and totals</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        {/* Restore Preview Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Restore Preview</DialogTitle>
              <DialogDescription>
                Review the changes before restoring
              </DialogDescription>
            </DialogHeader>

            {restorePreview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Current State</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[300px]">
                      {JSON.stringify(restorePreview.current, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Restored State</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[300px]">
                      {JSON.stringify(restorePreview.restored, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <Label>Reason for Restore *</Label>
                  <Textarea
                    placeholder="e.g., Customer confirmed correct data was as of Oct 14"
                    value={restoreReason}
                    onChange={(e) => setRestoreReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => restoreMutation.mutate()}
                disabled={!restoreReason}
              >
                Confirm Restore
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
