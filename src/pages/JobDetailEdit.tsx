import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';

interface JobDetail {
  job: any;
  customer: any;
  parts: any[];
  notes: any[];
}

interface PartFormData {
  id?: string;
  sku: string;
  description: string;
  quantity: string;
  unit_price: string;
}

export default function JobDetailEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [jobVersion, setJobVersion] = useState(1);

  // Form state for machine details
  const [machineCategory, setMachineCategory] = useState('');
  const [machineBrand, setMachineBrand] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineSerial, setMachineSerial] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // Labour state
  const [labourHours, setLabourHours] = useState('0');
  const [labourRate, setLabourRate] = useState('89');

  // Payment state
  const [serviceDeposit, setServiceDeposit] = useState('0');
  const [discountType, setDiscountType] = useState<string>('none');
  const [discountValue, setDiscountValue] = useState('0');

  // Part modal state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartFormData | null>(null);
  const [partForm, setPartForm] = useState<PartFormData>({
    sku: '',
    description: '',
    quantity: '1',
    unit_price: '0',
  });

  // Delete confirmation
  const [deletePartId, setDeletePartId] = useState<string | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  async function loadJob() {
    console.log('[JobDetailEdit] Loading job:', id);
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc('get_job_detail_simple', {
      p_job_id: id,
    });

    if (rpcError) {
      console.error('[JobDetailEdit] Error loading job:', rpcError);
      toast.error(`Failed to load job: ${rpcError.message}`);
      setLoading(false);
      return;
    }

    console.log('[JobDetailEdit] Job loaded:', data);
    setJobData(data);

    // Populate form fields
    const { job } = data;
    setJobVersion(job.version || 1);
    setMachineCategory(job.machine_category || '');
    setMachineBrand(job.machine_brand || '');
    setMachineModel(job.machine_model || '');
    setMachineSerial(job.machine_serial || '');
    setProblemDescription(job.problem_description || '');
    setLabourHours(String(job.labour_hours || 0));
    setLabourRate(String(job.labour_rate || 89));
    setServiceDeposit(String(job.service_deposit || 0));
    setDiscountType(job.discount_type || 'none');
    setDiscountValue(String(job.discount_value || 0));

    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    console.log('[JobDetailEdit] Updating status to:', newStatus);

    const { error } = await supabase.rpc('update_job_status', {
      p_job_id: id,
      p_status: newStatus,
    });

    if (error) {
      console.error('[JobDetailEdit] Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
      return;
    }

    console.log('[JobDetailEdit] Status updated successfully');
    toast.success('Status updated');
    loadJob();
  }

  async function saveJobChanges() {
    console.log('[JobDetailEdit] Saving job changes...');
    setSaving(true);

    try {
      // Build patch object with all changed fields
      const patch = {
        machine_category: machineCategory,
        machine_brand: machineBrand,
        machine_model: machineModel,
        machine_serial: machineSerial,
        problem_description: problemDescription,
        labour_hours: parseFloat(labourHours),
        labour_rate: parseFloat(labourRate),
        labour_total: parseFloat(labourHours) * parseFloat(labourRate),
        service_deposit: parseFloat(serviceDeposit),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
      };

      console.log('[JobDetailEdit] Calling update_job_simple with:', {
        p_job_id: id,
        p_version: jobVersion,
        p_patch: patch,
      });

      // Update job using RPC
      const { data: updateResult, error: updateError } = await supabase.rpc('update_job_simple', {
        p_job_id: id,
        p_version: jobVersion,
        p_patch: patch,
      });

      console.log('[JobDetailEdit] Update result:', updateResult);

      if (updateError) throw updateError;

      if (!updateResult?.updated) {
        throw new Error(updateResult?.error || 'Update failed');
      }

      // Recalculate totals
      console.log('[JobDetailEdit] Recalculating totals...');
      const { error: calcError } = await supabase.rpc('recalc_job_totals', {
        p_job_id: id,
      });

      if (calcError) throw calcError;

      console.log('[JobDetailEdit] Job saved successfully');
      toast.success('Job updated successfully');
      setIsEditing(false);
      setJobVersion(updateResult.new_version);
      loadJob();
    } catch (error: any) {
      console.error('[JobDetailEdit] Error saving job:', error);
      if (error.message?.includes('version')) {
        toast.error('Job was modified by someone else. Please reload and try again.');
        loadJob(); // Reload to get latest version
      } else {
        toast.error(`Failed to save: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function openPartModal(part?: any) {
    if (part) {
      setEditingPart(part);
      setPartForm({
        id: part.id,
        sku: part.sku || '',
        description: part.description,
        quantity: String(part.quantity),
        unit_price: String(part.unit_price),
      });
    } else {
      setEditingPart(null);
      setPartForm({
        sku: '',
        description: '',
        quantity: '1',
        unit_price: '0',
      });
    }
    setIsPartModalOpen(true);
  }

  async function savePart() {
    console.log('[JobDetailEdit] Saving part:', partForm);

    try {
      if (editingPart) {
        // Update existing part
        console.log('[JobDetailEdit] Calling update_job_part with:', {
          p_part_id: partForm.id,
          p_sku: partForm.sku,
          p_desc: partForm.description,
          p_qty: parseFloat(partForm.quantity),
          p_unit_price: parseFloat(partForm.unit_price),
        });

        const { error } = await supabase.rpc('update_job_part', {
          p_part_id: partForm.id,
          p_sku: partForm.sku,
          p_desc: partForm.description,
          p_qty: parseFloat(partForm.quantity),
          p_unit_price: parseFloat(partForm.unit_price),
        });

        if (error) throw error;
        console.log('[JobDetailEdit] Part updated successfully');
        toast.success('Part updated');
      } else {
        // Add new part
        console.log('[JobDetailEdit] Calling add_job_part with:', {
          p_job_id: id,
          p_sku: partForm.sku,
          p_desc: partForm.description,
          p_qty: parseFloat(partForm.quantity),
          p_unit_price: parseFloat(partForm.unit_price),
        });

        const { error } = await supabase.rpc('add_job_part', {
          p_job_id: id,
          p_sku: partForm.sku,
          p_desc: partForm.description,
          p_qty: parseFloat(partForm.quantity),
          p_unit_price: parseFloat(partForm.unit_price),
        });

        if (error) throw error;
        console.log('[JobDetailEdit] Part added successfully');
        toast.success('Part added');
      }

      // Recalculate totals after part change
      console.log('[JobDetailEdit] Recalculating totals after part change...');
      const { error: calcError } = await supabase.rpc('recalc_job_totals', {
        p_job_id: id,
      });

      if (calcError) console.error('Failed to recalc totals:', calcError);

      setIsPartModalOpen(false);
      loadJob();
    } catch (error: any) {
      console.error('[JobDetailEdit] Error saving part:', error);
      toast.error(`Failed to save part: ${error.message}`);
    }
  }

  async function deletePart(partId: string) {
    console.log('[JobDetailEdit] Calling delete_job_part with:', { p_part_id: partId });

    const { error } = await supabase.rpc('delete_job_part', {
      p_part_id: partId,
    });

    if (error) {
      console.error('[JobDetailEdit] Error deleting part:', error);
      toast.error(`Failed to delete part: ${error.message}`);
      return;
    }

    console.log('[JobDetailEdit] Part deleted successfully');
    
    // Recalculate totals after part deletion
    console.log('[JobDetailEdit] Recalculating totals after part deletion...');
    const { error: calcError } = await supabase.rpc('recalc_job_totals', {
      p_job_id: id,
    });

    if (calcError) console.error('Failed to recalc totals:', calcError);

    toast.success('Part deleted');
    setDeletePartId(null);
    loadJob();
  }

  async function addNote() {
    if (!newNote.trim()) return;

    console.log('[JobDetailEdit] Calling add_job_note with:', {
      p_job_id: id,
      p_note_text: newNote,
    });
    setAddingNote(true);

    try {
      const { data: noteId, error } = await supabase.rpc('add_job_note', {
        p_job_id: id,
        p_note_text: newNote,
      });

      if (error) throw error;

      console.log('[JobDetailEdit] Note added successfully, ID:', noteId);
      toast.success('Note added');
      setNewNote('');
      loadJob();
    } catch (error: any) {
      console.error('[JobDetailEdit] Error adding note:', error);
      toast.error(`Failed to add note: ${error.message}`);
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          Job not found
        </div>
      </div>
    );
  }

  const { job, customer, parts, notes } = jobData;
  
  // Calculate totals
  const calculatedPartTotal = parts?.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0) || 0;
  const calculatedLabourTotal = parseFloat(labourHours) * parseFloat(labourRate);
  const calculatedSubtotal = calculatedPartTotal + calculatedLabourTotal;
  
  // Calculate discount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = calculatedSubtotal * (parseFloat(discountValue) / 100);
  } else if (discountType === 'fixed') {
    discountAmount = parseFloat(discountValue);
  }
  
  const afterDiscount = calculatedSubtotal - discountAmount;
  const calculatedGST = afterDiscount * 0.1;
  const calculatedGrandTotal = afterDiscount + calculatedGST;
  const depositAmount = parseFloat(serviceDeposit);
  const calculatedBalanceDue = calculatedGrandTotal - depositAmount;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/jobs-simple')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold">Job {job.job_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created: {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'} | 
            Updated: {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'N/A'} | 
            Version: {jobVersion}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={saveJobChanges} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                loadJob(); // Reset form
              }}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Job
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={job.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="waiting-parts">Waiting Parts</SelectItem>
                <SelectItem value="waiting-quote">Waiting Quote</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="write-off">Write Off</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Customer Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {customer?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {customer?.phone || 'N/A'}</p>
              {customer?.email && <p><strong>Email:</strong> {customer.email}</p>}
              {customer?.address && <p><strong>Address:</strong> {customer.address}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Machine Details */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={machineCategory}
                onValueChange={setMachineCategory}
                disabled={!isEditing}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lawn-mower">Lawn Mower</SelectItem>
                  <SelectItem value="chainsaw">Chainsaw</SelectItem>
                  <SelectItem value="blower-vacuum">Blower/Vacuum</SelectItem>
                  <SelectItem value="hedge-trimmer">Hedge Trimmer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={machineBrand}
                onChange={(e) => setMachineBrand(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={machineModel}
                onChange={(e) => setMachineModel(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={machineSerial}
                onChange={(e) => setMachineSerial(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="problem">Problem Description</Label>
              <Textarea
                id="problem"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Parts</CardTitle>
            <Button onClick={() => openPartModal()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </CardHeader>
          <CardContent>
            {parts && parts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">SKU</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part: any) => (
                      <tr key={part.id} className="border-b">
                        <td className="py-2">{part.sku || 'N/A'}</td>
                        <td className="py-2">{part.description}</td>
                        <td className="text-right py-2">{part.quantity}</td>
                        <td className="text-right py-2">${part.unit_price.toFixed(2)}</td>
                        <td className="text-right py-2">${part.total_price.toFixed(2)}</td>
                        <td className="text-right py-2">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPartModal(part)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletePartId(part.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-semibold">Parts Subtotal:</td>
                      <td className="text-right py-2 font-semibold">${calculatedPartTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No parts added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Labour Section */}
        <Card>
          <CardHeader>
            <CardTitle>Labour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="labourHours">Hours</Label>
                <Input
                  id="labourHours"
                  type="number"
                  step="0.25"
                  value={labourHours}
                  onChange={(e) => setLabourHours(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="labourRate">Rate ($/hour)</Label>
                <Input
                  id="labourRate"
                  type="number"
                  step="1"
                  value={labourRate}
                  onChange={(e) => setLabourRate(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Total</Label>
                <Input
                  value={`$${calculatedLabourTotal.toFixed(2)}`}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serviceDeposit">Service Deposit ($)</Label>
              <Input
                id="serviceDeposit"
                type="number"
                step="0.01"
                value={serviceDeposit}
                onChange={(e) => setServiceDeposit(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={setDiscountType}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">
                  Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={!isEditing || discountType === 'none'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Parts Subtotal:</span>
                <span>${calculatedPartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labour Total:</span>
                <span>${calculatedLabourTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Subtotal:</span>
                <span>${calculatedSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (10%):</span>
                <span>${calculatedGST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>${calculatedGrandTotal.toFixed(2)}</span>
              </div>
              {depositAmount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Service Deposit:</span>
                  <span>-${depositAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-primary border-t pt-2">
                <span>Balance Due:</span>
                <span>${calculatedBalanceDue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notes ({notes?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notes && notes.length > 0 && (
              <div className="space-y-3 mb-4">
                {notes.map((note: any) => (
                  <div key={note.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                    <p>{note.note_text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newNote">Add Note</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note..."
                rows={3}
              />
              <Button onClick={addNote} disabled={!newNote.trim() || addingNote}>
                {addingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Part Modal */}
      <Dialog open={isPartModalOpen} onOpenChange={setIsPartModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Edit Part' : 'Add Part'}</DialogTitle>
            <DialogDescription>
              {editingPart ? 'Update part details' : 'Add a new part to this job'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="partSku">SKU</Label>
              <Input
                id="partSku"
                value={partForm.sku}
                onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="partDescription">Description *</Label>
              <Input
                id="partDescription"
                value={partForm.description}
                onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partQuantity">Quantity</Label>
                <Input
                  id="partQuantity"
                  type="number"
                  step="1"
                  min="1"
                  value={partForm.quantity}
                  onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="partUnitPrice">Unit Price ($)</Label>
                <Input
                  id="partUnitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={partForm.unit_price}
                  onChange={(e) => setPartForm({ ...partForm, unit_price: e.target.value })}
                />
              </div>
            </div>
            <div className="bg-muted p-3 rounded">
              <p className="text-sm">
                Total: ${(parseFloat(partForm.quantity || '0') * parseFloat(partForm.unit_price || '0')).toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPartModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={savePart}
              disabled={!partForm.description.trim()}
            >
              {editingPart ? 'Update' : 'Add'} Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePartId} onOpenChange={() => setDeletePartId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this part? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePartId && deletePart(deletePartId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
