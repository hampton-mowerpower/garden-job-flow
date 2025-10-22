import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Phone, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  'waiting-parts': { label: 'Waiting for Parts', color: 'bg-orange-500' },
  'waiting-quote': { label: 'Waiting for Quote', color: 'bg-purple-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  delivered: { label: 'Delivered', color: 'bg-teal-500' },
  'write-off': { label: 'Write Off', color: 'bg-red-500' },
};

export default function JobDetailComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    if (!id) return;

    console.log('[JobDetailComplete] Loading job:', id);
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
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !jobData) return;

    console.log('[JobDetailComplete] Changing status to:', newStatus);
    setUpdatingStatus(true);

    try {
      const { error } = await supabase.rpc('update_job_status', {
        p_job_id: id,
        p_status: newStatus,
      });

      if (error) throw error;

      console.log('[JobDetailComplete] Status updated successfully');
      toast.success('Status updated successfully');
      await loadJob(); // Reload to get fresh data
    } catch (error: any) {
      console.error('[JobDetailComplete] Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
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
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
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
      <Button
        variant="ghost"
        onClick={() => navigate('/jobs-simple')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Button>

      {/* JOB HEADER */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">
                {job.job_number}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created: {formatDate(job.created_at)}</span>
                <span>Updated: {formatDate(job.updated_at)}</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              {getStatusBadge(job.status)}
              <Button variant="outline" size="sm" disabled>
                <Printer className="mr-2 h-4 w-4" />
                Service Label
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Printer className="mr-2 h-4 w-4" />
                Collection Label
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="font-semibold">Change Status:</label>
            <Select
              value={job.status}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="waiting-parts">Waiting for Parts</SelectItem>
                <SelectItem value="waiting-quote">Waiting for Quote</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="write-off">Write Off</SelectItem>
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
              <p className="mt-1 whitespace-pre-wrap">{job.problem_description || 'No description provided'}</p>
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
            <Button size="sm" disabled>
              Add Part
            </Button>
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
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(part.total_price)}</td>
                      <td className="py-2 px-3 text-right">
                        <Button variant="ghost" size="sm" disabled>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          Delete
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
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labour Hours:</span>
              <span className="font-medium">{job.labour_hours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Labour Rate:</span>
              <span className="font-medium">{formatCurrency(job.labour_rate)}/hr</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Labour Total:</span>
              <span>{formatCurrency(job.labour_total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* SMALL REPAIR SECTION */}
        {(job.small_repair_minutes > 0 || job.small_repair_total > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Small Repair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minutes:</span>
                <span className="font-medium">{job.small_repair_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">{formatCurrency(job.small_repair_rate)}/hr</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Small Repair Total:</span>
                <span>{formatCurrency(job.small_repair_total)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* TRANSPORT SECTION */}
      {(job.transport_pickup_required || job.transport_delivery_required) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              {job.transport_pickup_required && (
                <Badge variant="outline">Pickup Required</Badge>
              )}
              {job.transport_delivery_required && (
                <Badge variant="outline">Delivery Required</Badge>
              )}
            </div>
            {job.transport_distance_km && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium">{job.transport_distance_km} km</span>
              </div>
            )}
            {job.transport_size_tier && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size Tier:</span>
                <span className="font-medium capitalize">{job.transport_size_tier}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Transport Charge:</span>
              <span>{formatCurrency(job.transport_total_charge)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SHARPEN SECTION */}
      {(job.sharpen_items?.length > 0 || job.sharpen_total_charge > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sharpening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.sharpen_items?.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Items:</label>
                <ul className="list-disc list-inside mt-1">
                  {job.sharpen_items.map((item: any, index: number) => (
                    <li key={index}>{JSON.stringify(item)}</li>
                  ))}
                </ul>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Sharpen Total:</span>
              <span>{formatCurrency(job.sharpen_total_charge)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PRICING SUMMARY */}
      <Card className="mt-6 border-2">
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(job.subtotal)}</span>
          </div>
          {job.discount_value > 0 && (
            <>
              <div className="flex justify-between text-red-600">
                <span>Discount ({job.discount_type}):</span>
                <span>-{formatCurrency(job.discount_value)}</span>
              </div>
              <Separator />
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST (10%):</span>
            <span className="font-medium">{formatCurrency(job.gst)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-2xl font-bold">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(job.grand_total)}</span>
          </div>
          {job.service_deposit && job.service_deposit > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-green-600">
                <span>Service Deposit:</span>
                <span>-{formatCurrency(job.service_deposit)}</span>
              </div>
            </>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between text-2xl font-bold text-primary">
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(job.balance_due)}</span>
          </div>
        </CardContent>
      </Card>

      {/* NOTES SECTION */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No notes added yet</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(note.created_at)}
                    </span>
                    {note.created_by && (
                      <span className="text-sm font-medium">{note.created_by}</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{note.note_text}</p>
                </div>
              ))}
            </div>
          )}
          <Separator className="my-4" />
          <div className="space-y-2">
            <label className="text-sm font-semibold">Add New Note</label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md resize-y"
              placeholder="Type your note here..."
              disabled
            />
            <Button size="sm" disabled>
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DATES & METADATA */}
      {(job.completed_at || job.delivered_at || job.requested_finish_date) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.requested_finish_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Finish Date:</span>
                <span className="font-medium">{formatDate(job.requested_finish_date)}</span>
              </div>
            )}
            {job.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed At:</span>
                <span className="font-medium">{formatDate(job.completed_at)}</span>
              </div>
            )}
            {job.delivered_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered At:</span>
                <span className="font-medium">{formatDate(job.delivered_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
