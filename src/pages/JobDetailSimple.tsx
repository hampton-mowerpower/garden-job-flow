import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface JobDetail {
  job: any;
  customer: any;
  parts: any[];
  notes: any[];
}

export default function JobDetailSimple() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  async function loadJob() {
    console.log('🔵 Fetching job detail for:', id);
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_job_detail_simple', {
      p_job_id: id,
    });

    if (rpcError) {
      console.error('❌ Error fetching job:', rpcError);
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    console.log('✅ Job data received:', data);
    setJobData(data);
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    console.log('🔵 Updating job status to:', newStatus);
    setUpdatingStatus(true);

    const { error: rpcError } = await supabase.rpc('update_job_status', {
      p_job_id: id,
      p_status: newStatus,
    });

    if (rpcError) {
      console.error('❌ Error updating status:', rpcError);
      toast.error(`Failed to update status: ${rpcError.message}`);
      setUpdatingStatus(false);
      return;
    }

    console.log('✅ Status updated successfully');
    toast.success('Status updated');
    setUpdatingStatus(false);
    loadJob(); // Reload to get fresh data
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

  if (error || !jobData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <strong>Error:</strong> {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const { job, customer, parts, notes } = jobData;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/jobs-simple')}>
            ← Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold mt-2">Job {job.job_number}</h1>
        </div>
        <Button onClick={() => navigate(`/jobs-simple/${id}/edit`)}>
          Edit Job
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={job.status}
              onValueChange={updateStatus}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="parts">Awaiting Parts</SelectItem>
                <SelectItem value="quotes">Quote Sent</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="write_off">Write Off</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {customer.name}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">No customer assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Machine Card */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Category:</strong> {job.machine_category || 'N/A'}</p>
              <p><strong>Brand:</strong> {job.machine_brand || 'N/A'}</p>
              <p><strong>Model:</strong> {job.machine_model || 'N/A'}</p>
              <p><strong>Serial:</strong> {job.machine_serial || 'N/A'}</p>
              {job.problem_description && (
                <p><strong>Problem:</strong> {job.problem_description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Parts ({parts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {parts && parts.length > 0 ? (
              <div className="space-y-2">
                {parts.map((part: any) => (
                  <div key={part.id} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{part.description}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {part.sku} | Qty: {part.quantity}
                      </p>
                    </div>
                    <p className="font-medium">${(part.total_price || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No parts added</p>
            )}
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Parts:</span>
                <span>${(job.parts_subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labour:</span>
                <span>${(job.labour_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(job.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>${(job.gst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Grand Total:</span>
                <span>${(job.grand_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-primary">
                <span>Balance Due:</span>
                <span>${(job.balance_due || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        {notes && notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Notes ({notes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <div key={note.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                    <p>{note.note_text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
