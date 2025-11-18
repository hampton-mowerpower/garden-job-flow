import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useJobDetail, JobDetail } from '@/hooks/useJobDetail';
import { supabase } from '@/lib/supabase';
import JobForm from '@/components/JobForm';

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch job details using the hook (includes parts data)
  const { data: job, isLoading, error, refetch } = useJobDetail(id);
  
  // Also fetch the raw response to get parts array
  const [partsData, setPartsData] = React.useState<any[]>([]);

  // Fetch parts data when job loads
  React.useEffect(() => {
    if (id) {
      supabase.rpc('get_job_detail_simple', { p_job_id: id })
        .then(({ data }) => {
          if (data && data.parts) {
            console.log('[JobEdit] Loaded parts:', data.parts);
            setPartsData(data.parts);
          }
        });
    }
  }, [id]);

  const handleSave = async (patch: Partial<JobDetail>, version: number) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc('update_job_simple', {
        p_job_id: id,
        p_version: version,
        p_patch: patch
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to save job',
          description: error.message
        });
        return;
      }

      if (data?.updated === false) {
        if (data.error === 'Version conflict') {
          toast({
            variant: 'destructive',
            title: 'Conflict Detected',
            description: 'This job was changed elsewhere. Reload to continue.',
            action: (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reload
              </Button>
            )
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Update failed',
            description: data.error || 'Unknown error'
          });
        }
        return;
      }

      console.log('[JobEdit] ✅ Job saved successfully');
      
      // DO NOT refetch here - it causes form state to reset!
      // The saved data is already correct, just navigate away
      
      toast({
        title: 'Success',
        description: 'Job updated successfully'
      });

      // Navigate immediately to show the updated job
      navigate(`/jobs/${id}`);
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save job'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-semibold mb-4">Job Not Found</p>
            <p className="text-muted-foreground mb-6">
              The job you're trying to edit doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/jobs')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // useJobDetail now returns flattened JobDetail structure
  // No need for nested extraction anymore
  console.log('[JobEdit] Job data:', job?.job_number);
  console.log('[JobEdit] Customer data:', job?.customer_name);

  // Safety check - if job is still empty or doesn't have required fields, show error
  if (!job || !job.id) {
    console.error('[JobEdit] CRITICAL: job is invalid:', job);
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-semibold mb-4">Unable to Load Job Data</p>
            <p className="text-muted-foreground mb-6">
              The job data structure is invalid. Please try refreshing the page.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate('/jobs')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            try {
              navigate(`/jobs/${id}`);
            } catch (err) {
              console.error('[JobEdit] Navigation error:', err);
              toast({ variant: 'destructive', title: 'Navigation failed', description: 'Please try again' });
            }
          }} 
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Button>
      </div>

      {/* Edit Form - JobForm handles its own save button */}
      <JobForm 
        job={{
          id: job.id || id,
          jobNumber: job.job_number || '',
          status: job.status || 'pending',
          customer: {
            id: job.customer_id || '',
            name: job.customer_name || '',
            phone: job.customer_phone || '',
            email: job.customer_email || '',
            address: job.customer_address || ''
          },
          machineCategory: job.machine_category || '',
          machineBrand: job.machine_brand || '',
          machineModel: job.machine_model || '',
          machineSerial: job.machine_serial || '',
          problemDescription: job.problem_description || '',
          notes: job.notes || '',
          servicePerformed: job.service_performed || '',
          recommendations: job.recommendations || '',
          labourHours: Number(job.labour_hours) || 0,
          labourRate: Number(job.labour_rate) || 95,
          labourTotal: Number(job.labour_total) || 0,
          parts: partsData.map(p => ({
            id: p.id,
            partId: p.part_id || p.id,
            partName: p.description,
            quantity: Number(p.quantity),
            unitPrice: Number(p.unit_price),
            totalPrice: Number(p.total_price),
            category: p.equipment_category,
            sku: p.sku
          })),
          grandTotal: Number(job.grand_total) || 0,
          balanceDue: Number(job.balance_due) || 0,
          subtotal: Number(job.subtotal) || 0,
          gst: Number(job.gst) || 0,
          partsSubtotal: Number(job.parts_subtotal) || 0,
          createdAt: job.created_at ? new Date(job.created_at) : new Date(),
          updatedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
          version: Number(job.version) || 1
        } as any}
        onSave={(savedJob) => {
          console.log('[JobEdit] onSave called with:', savedJob);
          
          // Extract only changed fields
          const patch: Partial<JobDetail> = {};
          if (savedJob.notes !== job.notes) patch.notes = savedJob.notes;
          if (savedJob.problemDescription !== job.problem_description) patch.problem_description = savedJob.problemDescription;
          if (savedJob.servicePerformed !== job.service_performed) patch.service_performed = savedJob.servicePerformed;
          if (savedJob.recommendations !== job.recommendations) patch.recommendations = savedJob.recommendations;
          if (savedJob.machineCategory !== job.machine_category) patch.machine_category = savedJob.machineCategory;
          if (savedJob.machineBrand !== job.machine_brand) patch.machine_brand = savedJob.machineBrand;
          if (savedJob.machineModel !== job.machine_model) patch.machine_model = savedJob.machineModel;
          if (savedJob.machineSerial !== job.machine_serial) patch.machine_serial = savedJob.machineSerial;
          if (savedJob.status !== job.status) patch.status = savedJob.status;
          if (savedJob.labourHours !== job.labour_hours) patch.labour_hours = savedJob.labourHours;
          if (savedJob.labourRate !== job.labour_rate) patch.labour_rate = savedJob.labourRate;
          if (savedJob.labourTotal !== job.labour_total) patch.labour_total = savedJob.labourTotal;
          
          console.log('[JobEdit] Patch to save:', patch);
          handleSave(patch, savedJob.version || 1);
        }}
        onReturnToList={() => {
          try {
            navigate(`/jobs/${id}`);
          } catch (err) {
            console.error('[JobEdit] Return navigation error:', err);
            toast({ variant: 'destructive', title: 'Navigation failed', description: 'Please try again' });
          }
        }}
      />
    </div>
  );
}
