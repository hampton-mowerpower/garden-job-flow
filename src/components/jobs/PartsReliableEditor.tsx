import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Part {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PartsReliableEditorProps {
  jobId: string;
  initialParts?: Part[];
  onSaveComplete?: () => void;
}

export const PartsReliableEditor: React.FC<PartsReliableEditorProps> = ({
  jobId,
  initialParts = [],
  onSaveComplete
}) => {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>(
    initialParts.length > 0
      ? initialParts
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function createEmptyPart(): Part {
    return {
      description: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
    };
  }

  const addPart = () => {
    setParts([...parts, createEmptyPart()]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof Part, value: any) => {
    setParts(parts.map((part, i) => {
      if (i === index) {
        const updated = { ...part, [field]: value };
        
        // Recalculate totals
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : part.quantity;
          const price = field === 'unit_price' ? parseFloat(value) || 0 : part.unit_price;
          updated.total_price = qty * price;
        }
        
        return updated;
      }
      return part;
    }));
  };

  const saveParts = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('[PartsReliableEditor] Starting save for job:', jobId);

      // Filter out empty parts
      const validParts = parts.filter(p => p.description.trim());
      
      console.log('[PartsReliableEditor] Valid parts to save:', validParts);

      // Step 1: Get existing part IDs for this job
      const { data: existingParts, error: fetchErr } = await supabase
        .from('job_parts')
        .select('id')
        .eq('job_id', jobId);

      if (fetchErr) throw fetchErr;

      const existingIds = (existingParts || []).map(p => p.id);
      const currentIds = validParts.filter(p => p.id).map(p => p.id!);

      console.log('[PartsReliableEditor] Existing IDs:', existingIds);
      console.log('[PartsReliableEditor] Current IDs:', currentIds);

      // Step 2: Delete parts that were removed (using RPC)
      const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

      if (idsToDelete.length > 0) {
        console.log('[PartsReliableEditor] Deleting parts:', idsToDelete);
        for (const partId of idsToDelete) {
          const { error: deleteErr } = await supabase.rpc('delete_job_part', {
            p_part_id: partId
          });
          if (deleteErr) throw deleteErr;
        }
        console.log('[PartsReliableEditor] Parts deleted via RPC');
      }

      // Step 3: Add or update parts (using RPCs)
      for (const part of validParts) {
        const partData = {
          p_sku: '', // No SKU in this editor
          p_desc: part.description.trim(),
          p_qty: part.quantity || 0,
          p_unit_price: part.unit_price || 0,
        };

        if (part.id) {
          // Update existing part
          console.log('[PartsReliableEditor] Updating part:', part.id, partData);
          const { error: updateErr } = await supabase.rpc('update_job_part', {
            p_part_id: part.id,
            ...partData
          });
          if (updateErr) throw updateErr;
        } else {
          // Add new part
          console.log('[PartsReliableEditor] Adding new part:', partData);
          const { error: addErr } = await supabase.rpc('add_job_part', {
            p_job_id: jobId,
            ...partData
          });
          if (addErr) throw addErr;
        }
      }

      console.log('[PartsReliableEditor] All parts saved via RPC - totals auto-calculated');

      toast({
        title: 'Parts Saved',
        description: `Saved ${validParts.length} part(s) successfully`,
      });

      if (onSaveComplete) {
        onSaveComplete();
      }

      // Refresh parts from database
      await refreshParts();

    } catch (error: any) {
      console.error('[PartsReliableEditor] Save failed:', error);
      setError(error.message || 'Failed to save parts');
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshParts = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('job_parts')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        setParts(data.map(p => ({
          id: p.id,
          description: p.description || '',
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price,
        })));
      }
    } catch (error) {
      console.error('[PartsReliableEditor] Refresh failed:', error);
    }
  };

  const calculateTotals = () => {
    const subtotal = parts.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const totals = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parts ({parts.length})</span>
          <div className="flex gap-2">
            <Button onClick={addPart} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
            <Button
              onClick={saveParts}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Parts
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No parts added yet. Click "Add Part" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part, index) => (
              <div
                key={part.id || index}
                className="grid grid-cols-12 gap-2 items-center p-3 border rounded"
              >
                <div className="col-span-5">
                  <Input
                    placeholder="Part description"
                    value={part.description}
                    onChange={(e) => updatePart(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={part.quantity || ''}
                    onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={part.unit_price || ''}
                    onChange={(e) => updatePart(index, 'unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2 font-medium">
                  ${part.total_price.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePart(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>GST (10%):</span>
            <span className="font-medium">${totals.gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
