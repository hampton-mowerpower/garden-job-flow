import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface JobData {
  id: string;
  job_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  machine_category: string;
  machine_brand: string;
  machine_model: string;
  machine_serial: string;
  problem_description: string;
  notes: string;
  parts: Array<{
    id: string;
    sku: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function JobEditClean() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobData | null>(null);

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      console.log('🔄 Fetching job data...');
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc('get_job_detail_simple', {
          p_job_id: id
        });

        if (error) {
          console.error('❌ RPC error:', error);
          throw error;
        }

        console.log('✅ Job data received:', data);

        if (!data) {
          throw new Error('Job not found');
        }

        // Handle both array and object responses
        const jobData = Array.isArray(data) ? data[0] : data;
        
        // Parse the nested JSON structure
        const parsedJob: JobData = {
          id: jobData.job.id,
          job_number: jobData.job.job_number,
          status: jobData.job.status,
          customer_name: jobData.customer?.name || 'Unknown',
          customer_phone: jobData.customer?.phone || '',
          machine_category: jobData.job.machine_category || '',
          machine_brand: jobData.job.machine_brand || '',
          machine_model: jobData.job.machine_model || '',
          machine_serial: jobData.job.machine_serial || '',
          problem_description: jobData.job.problem_description || '',
          notes: jobData.job.notes || '',
          parts: jobData.parts || []
        };

        console.log('📦 Parsed job data:', parsedJob);
        setJob(parsedJob);
      } catch (err: any) {
        console.error('❌ Failed to fetch job:', err);
        setError(err.message || 'Failed to load job');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'Failed to load job'
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id, toast]);

  // Update status
  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;

    console.log('🔄 Updating status to:', newStatus);
    setSaving(true);

    try {
      const { error } = await supabase.rpc('update_job_status', {
        p_job_id: job.id,
        p_status: newStatus
      });

      if (error) {
        console.error('❌ Status update error:', error);
        throw error;
      }

      console.log('✅ Status updated successfully');
      setJob({ ...job, status: newStatus });
      
      toast({
        title: 'Success',
        description: 'Status updated successfully'
      });
    } catch (err: any) {
      console.error('❌ Failed to update status:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update status'
      });
    } finally {
      setSaving(false);
    }
  };

  // Update machine details
  const handleMachineUpdate = async () => {
    if (!job) return;

    console.log('🔄 Updating machine details...');
    setSaving(true);

    try {
      const { error } = await supabase
        .from('jobs_db')
        .update({
          machine_category: job.machine_category,
          machine_brand: job.machine_brand,
          machine_model: job.machine_model,
          machine_serial: job.machine_serial,
          problem_description: job.problem_description,
          notes: job.notes
        })
        .eq('id', job.id);

      if (error) {
        console.error('❌ Machine update error:', error);
        throw error;
      }

      console.log('✅ Machine details updated successfully');
      
      toast({
        title: 'Success',
        description: 'Machine details updated successfully'
      });
    } catch (err: any) {
      console.error('❌ Failed to update machine details:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update machine details'
      });
    } finally {
      setSaving(false);
    }
  };

  // Add part
  const handleAddPart = async () => {
    if (!job) return;

    const newPart = {
      sku: 'NEW-PART',
      desc: 'New Part',
      qty: 1,
      unit_price: 0
    };

    console.log('🔄 Adding part:', newPart);
    setSaving(true);

    try {
      const { data, error } = await supabase.rpc('add_job_part', {
        p_job_id: job.id,
        p_sku: newPart.sku,
        p_desc: newPart.desc,
        p_qty: newPart.qty,
        p_unit_price: newPart.unit_price
      });

      if (error) {
        console.error('❌ Add part error:', error);
        throw error;
      }

      console.log('✅ Part added successfully:', data);

      // Refetch job to get updated parts
      const { data: refreshedData } = await supabase.rpc('get_job_detail_simple', {
        p_job_id: id
      });

      if (refreshedData) {
        const jobData = Array.isArray(refreshedData) ? refreshedData[0] : refreshedData;
        setJob(prev => prev ? { ...prev, parts: jobData.parts || [] } : null);
      }

      toast({
        title: 'Success',
        description: 'Part added successfully'
      });
    } catch (err: any) {
      console.error('❌ Failed to add part:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to add part'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete part
  const handleDeletePart = async (partId: string) => {
    console.log('🔄 Deleting part:', partId);
    setSaving(true);

    try {
      const { error } = await supabase.rpc('delete_job_part', {
        p_part_id: partId
      });

      if (error) {
        console.error('❌ Delete part error:', error);
        throw error;
      }

      console.log('✅ Part deleted successfully');

      setJob(prev => prev ? {
        ...prev,
        parts: prev.parts.filter(p => p.id !== partId)
      } : null);

      toast({
        title: 'Success',
        description: 'Part deleted successfully'
      });
    } catch (err: any) {
      console.error('❌ Failed to delete part:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to delete part'
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg">Loading job data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-xl font-semibold mb-4">Error Loading Job</p>
            <p className="text-muted-foreground mb-6">{error || 'Job not found'}</p>
            <Button onClick={() => navigate('/jobs')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/jobs')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <h1 className="text-2xl font-bold">Job #{job.job_number}</h1>
      </div>

      {/* Customer Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Customer Name</Label>
            <Input value={job.customer_name} disabled />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={job.customer_phone} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={job.status} onValueChange={handleStatusChange} disabled={saving}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Machine Details */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Category</Label>
            <Input
              value={job.machine_category}
              onChange={(e) => setJob({ ...job, machine_category: e.target.value })}
            />
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              value={job.machine_brand}
              onChange={(e) => setJob({ ...job, machine_brand: e.target.value })}
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              value={job.machine_model}
              onChange={(e) => setJob({ ...job, machine_model: e.target.value })}
            />
          </div>
          <div>
            <Label>Serial</Label>
            <Input
              value={job.machine_serial}
              onChange={(e) => setJob({ ...job, machine_serial: e.target.value })}
            />
          </div>
          <div>
            <Label>Problem Description</Label>
            <Textarea
              value={job.problem_description}
              onChange={(e) => setJob({ ...job, problem_description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={job.notes}
              onChange={(e) => setJob({ ...job, notes: e.target.value })}
              rows={3}
            />
          </div>
          <Button onClick={handleMachineUpdate} disabled={saving}>
            Save Machine Details
          </Button>
        </CardContent>
      </Card>

      {/* Parts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parts</CardTitle>
          <Button onClick={handleAddPart} disabled={saving} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Part
          </Button>
        </CardHeader>
        <CardContent>
          {job.parts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No parts added yet</p>
          ) : (
            <div className="space-y-2">
              {job.parts.map((part) => (
                <div key={part.id} className="flex items-center gap-4 p-4 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{part.description}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {part.sku} | Qty: {part.quantity} | Price: ${part.unit_price} | Total: ${part.total_price}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePart(part.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
