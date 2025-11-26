import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Printer, Phone, Mail, Edit, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PartsPicker } from '@/components/booking/PartsPicker';
import { ServiceLabelPrintDialog } from '@/components/ServiceLabelPrintDialog';

interface JobDetailData {
  job: {
    id: string;
    job_number: string;
    status: string;
    customer_id: string;
    machine_category: string;
    machine_brand: string;
    machine_model: string;
    machine_serial: string | null;
    problem_description: string;
    notes: string | null;
    service_performed: string | null;
    recommendations: string | null;
    labour_hours: number;
    labour_rate: number;
    labour_total: number;
    parts_subtotal: number;
    subtotal: number;
    gst: number;
    grand_total: number;
    service_deposit: number | null;
    balance_due: number;
    discount_type: string | null;
    discount_value: number;
    transport_pickup_required: boolean;
    transport_delivery_required: boolean;
    transport_distance_km: number | null;
    transport_size_tier: string | null;
    transport_total_charge: number;
    sharpen_items: any[];
    sharpen_total_charge: number;
    small_repair_minutes: number;
    small_repair_rate: number;
    small_repair_total: number;
    requested_finish_date: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    delivered_at: string | null;
    version: number;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    company_name: string | null;
    customer_type: string | null;
  };
  parts: Array<{
    id: string;
    sku: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes: Array<{
    id: string;
    note_text: string;
    created_at: string;
    created_by: string | null;
  }>;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
  'awaiting_parts': { label: 'Awaiting Parts', color: 'bg-orange-500' },
  'awaiting_quote': { label: 'Awaiting Quote', color: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  delivered: { label: 'Delivered', color: 'bg-teal-500' },
  'write_off': { label: 'Write Off', color: 'bg-red-500' },
};

export default function JobDetailComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  const [showServiceLabel, setShowServiceLabel] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Editable fields
  const [labourHours, setLabourHours] = useState(0);
  const [labourRate, setLabourRate] = useState(89);
  const [serviceDeposit, setServiceDeposit] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);

  // Track if we're already loading to prevent duplicate requests
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]); // Only reload when ID changes

  // Sync form fields when job data loads - but don't trigger on every jobData change
  useEffect(() => {
    if (jobData && !editMode) {
      setLabourHours(jobData.job.labour_hours);
      setLabourRate(jobData.job.labour_rate);
      setServiceDeposit(jobData.job.service_deposit || 0);
      setDiscountType((jobData.job.discount_type as any) || 'none');
      setDiscountValue(jobData.job.discount_value || 0);
    }
  }, [jobData?.job.id]); // Only sync when job ID changes, not on every jobData update

  const loadJob = async () => {
    if (!id || isLoadingJob) return; // Prevent duplicate requests

    console.log('[JobDetailComplete] Loading job:', id);
    setIsLoadingJob(true);
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_job_detail_simple', {
        p_job_id: id,
      });

      if (error) throw error;

      console.log('[JobDetailComplete] Loaded job data:', data);
      setJobData(data);
    } catch (error: any) {
      console.error('[JobDetailComplete] Error loading job:', error);
      toast.error(error.message || 'Failed to load job');
    } finally {
      setLoading(false);
      setIsLoadingJob(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    setUpdatingStatus(true);
    console.log('[JobDetailComplete] Updating status to:', newStatus);

    try {
      const { error } = await supabase.rpc('update_job_status', {
        p_job_id: id,
        p_status: newStatus,
      });

      if (error) throw error;

      console.log('[JobDetailComplete] Status updated successfully');
      toast.success('Status updated successfully');
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddPart = async (
    part: {
      id: string;
      sku: string;
      name: string;
      category: string;
      base_price: number;
      sell_price: number;
    },
    quantity: number,
    overridePrice?: number
  ) => {
    if (!id) return;

    console.log('[JobDetailComplete] Adding part:', part, quantity, overridePrice);

    try {
      const { error } = await supabase.rpc('add_job_part', {
        p_job_id: id,
        p_sku: part.sku,
        p_desc: part.name,
        p_qty: quantity,
        p_unit_price: overridePrice || part.sell_price,
      });

      if (error) throw error;

      toast.success('Part added successfully');
      setShowPartsDialog(false);
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error adding part:', error);
      toast.error(error.message || 'Failed to add part');
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this part?')) return;

    console.log('[JobDetailComplete] Deleting part:', partId);

    try {
      const { error } = await supabase.rpc('delete_job_part', {
        p_part_id: partId,
      });

      if (error) throw error;

      toast.success('Part deleted successfully');
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error deleting part:', error);
      toast.error(error.message || 'Failed to delete part');
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;

    setAddingNote(true);
    console.log('[JobDetailComplete] Adding note:', noteText);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('job_notes').insert({
        job_id: id,
        note_text: noteText,
        created_by: user?.id || null,
      });

      if (error) throw error;

      toast.success('Note added successfully');
      setNoteText('');
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveLabour = async () => {
    if (!id) return;

    console.log('[JobDetailComplete] Saving labour:', { labourHours, labourRate });

    try {
      const { error } = await supabase
        .from('jobs_db')
        .update({
          labour_hours: labourHours,
          labour_rate: labourRate,
          labour_total: labourHours * labourRate,
        })
        .eq('id', id);

      if (error) throw error;

      // Recalculate totals
      const { error: recalcError } = await supabase.rpc('recalc_job_totals', {
        p_job_id: id,
      });

      if (recalcError) throw recalcError;

      toast.success('Labour updated successfully');
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error saving labour:', error);
      toast.error(error.message || 'Failed to save labour');
    }
  };

  const handleSaveDeposit = async () => {
    if (!id) return;

    console.log('[JobDetailComplete] Saving deposit:', serviceDeposit);

    try {
      const { error } = await supabase
        .from('jobs_db')
        .update({
          service_deposit: serviceDeposit,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Deposit updated successfully');
      await loadJob();
    } catch (error: any) {
      console.error('[JobDetailComplete] Error saving deposit:', error);
      toast.error(error.message || 'Failed to save deposit');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-500',
    };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The job you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => navigate('/jobs-simple')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { job, customer, parts, notes } = jobData;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/jobs-simple')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      {/* JOB HEADER */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">{job.job_number}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created: {formatDate(job.created_at)}</span>
                <span>Updated: {formatDate(job.updated_at)}</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
              {getStatusBadge(job.status)}
              <Button variant="outline" size="sm" onClick={() => setShowServiceLabel(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print Label
              </Button>
              <Button
                variant={editMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                {editMode ? 'View Mode' : 'Edit Mode'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="font-semibold">Change Status:</label>
            <Select value={job.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                <SelectItem value="awaiting_quote">Awaiting Quote</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="write_off">Write Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CUSTOMER SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Name</label>
              <p className="text-lg font-medium">{customer.name}</p>
            </div>
            {customer.company_name && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Company</label>
                <p className="text-lg">{customer.company_name}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                {customer.phone}
              </a>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.address && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Address</label>
                <p>{customer.address}</p>
              </div>
            )}
            {customer.customer_type && (
              <div>
                <Badge variant="outline" className="capitalize">
                  {customer.customer_type}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MACHINE DETAILS */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Category</label>
              <p className="text-lg capitalize">{job.machine_category}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Brand</label>
              <p className="text-lg capitalize">{job.machine_brand}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Model</label>
              <p className="text-lg uppercase">{job.machine_model}</p>
            </div>
            {job.machine_serial && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Serial Number</label>
                <p className="font-mono">{job.machine_serial}</p>
              </div>
            )}
            <Separator />
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Problem Description</label>
              <p className="mt-1 whitespace-pre-wrap">
                {job.problem_description || 'No description provided'}
              </p>
            </div>
            {job.service_performed && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Service Performed</label>
                <p className="mt-1 whitespace-pre-wrap">{job.service_performed}</p>
              </div>
            )}
            {job.recommendations && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Recommendations</label>
                <p className="mt-1 whitespace-pre-wrap">{job.recommendations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PARTS SECTION */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Parts</CardTitle>
            <Dialog open={showPartsDialog} onOpenChange={setShowPartsDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Add Part</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Part</DialogTitle>
                </DialogHeader>
                <PartsPicker equipmentCategory={job.machine_category} onAddPart={handleAddPart} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No parts added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">SKU</th>
                    <th className="text-left py-2 px-3 font-semibold">Description</th>
                    <th className="text-right py-2 px-3 font-semibold">Qty</th>
                    <th className="text-right py-2 px-3 font-semibold">Unit Price</th>
                    <th className="text-right py-2 px-3 font-semibold">Total</th>
                    <th className="text-right py-2 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part.id} className="border-b">
                      <td className="py-2 px-3">{part.sku}</td>
                      <td className="py-2 px-3">{part.description}</td>
                      <td className="py-2 px-3 text-right">{part.quantity}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(part.unit_price)}</td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(part.total_price)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={4} className="py-2 px-3 text-right">
                      Parts Subtotal:
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(job.parts_subtotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* LABOUR SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Labour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Hours</label>
                {editMode ? (
                  <Input
                    type="number"
                    step="0.25"
                    value={labourHours}
                    onChange={(e) => setLabourHours(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-medium mt-1">{job.labour_hours}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rate</label>
                {editMode ? (
                  <Input
                    type="number"
                    value={labourRate}
                    onChange={(e) => setLabourRate(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-medium mt-1">{formatCurrency(job.labour_rate)}/hr</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Total</label>
                <p className="text-lg font-medium mt-1">
                  {formatCurrency(editMode ? labourHours * labourRate : job.labour_total)}
                </p>
              </div>
            </div>
            {editMode && (
              <Button onClick={handleSaveLabour} className="mt-4">
                Save Labour
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PRICING SUMMARY */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Subtotal:</span>
                <span className="font-medium">{formatCurrency(job.parts_subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour Total:</span>
                <span className="font-medium">{formatCurrency(job.labour_total)}</span>
              </div>
              {job.small_repair_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Small Repair:</span>
                  <span className="font-medium">{formatCurrency(job.small_repair_total)}</span>
                </div>
              )}
              {job.transport_total_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transport:</span>
                  <span className="font-medium">{formatCurrency(job.transport_total_charge)}</span>
                </div>
              )}
              {job.sharpen_total_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sharpening:</span>
                  <span className="font-medium">{formatCurrency(job.sharpen_total_charge)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(job.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (10%):</span>
                <span className="font-medium">{formatCurrency(job.gst)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span>{formatCurrency(job.grand_total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Deposit:</span>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={serviceDeposit}
                      onChange={(e) => setServiceDeposit(parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                    <Button onClick={handleSaveDeposit} size="sm">
                      Save
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium">{formatCurrency(job.service_deposit)}</span>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>Balance Due:</span>
                <span>{formatCurrency(job.balance_due)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NOTES SECTION */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Job Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="border-l-2 border-primary pl-4">
                  <p className="text-sm text-muted-foreground">{formatDate(note.created_at)}</p>
                  <p className="mt-1">{note.note_text}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No notes yet</p>
            )}

            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium">Add Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter note text..."
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!noteText.trim() || addingNote}>
                Add Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Label Dialog */}
      <ServiceLabelPrintDialog
        job={{
          id: jobData.job.id,
          jobNumber: jobData.job.job_number,
          customer: {
            name: jobData.customer.name,
            phone: jobData.customer.phone,
            email: jobData.customer.email,
            address: jobData.customer.address,
          },
          status: jobData.job.status,
          machineCategory: jobData.job.machine_category,
          machineBrand: jobData.job.machine_brand,
          machineModel: jobData.job.machine_model,
          machineSerial: jobData.job.machine_serial,
          problemDescription: jobData.job.problem_description,
          createdAt: jobData.job.created_at,
        } as any}
        open={showServiceLabel}
        onOpenChange={setShowServiceLabel}
        onPrint={(quantity, template) => {
          console.log('Printing label:', quantity, template);
          // TODO: Implement actual printing
          toast.success('Print dialog would open here');
        }}
      />
    </div>
  );
}
