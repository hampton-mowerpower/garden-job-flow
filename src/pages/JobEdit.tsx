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

  // Fetch job details using the hook
  const { data: job, isLoading, error, refetch } = useJobDetail(id);

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

  // Log the raw API response to debug structure
  console.log('[JobEdit] Raw API response type:', typeof job);
  
  // Handle the response structure properly
  // The get_job_detail_simple RPC can return either a direct job object or wrapped structure
  // JobDetail is always a flat structure with customer fields
  const actualJob = job;
  const customerData = {
    id: job.customer_id,
    name: job.customer_name,
    phone: job.customer_phone,
    email: job.customer_email,
    address: job.customer_address
  };
  
  console.log('[JobEdit] Extracted actualJob ID:', actualJob?.id);
  console.log('[JobEdit] Extracted customer name:', customerData?.name || actualJob?.customer_name);

  // Safety check - if actualJob is still empty or doesn't have required fields, show error
  if (!actualJob || !actualJob.id) {
    console.error('[JobEdit] CRITICAL: actualJob is invalid:', actualJob);
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
          id: actualJob.id || id,
          jobNumber: actualJob.job_number || '',
          status: actualJob.status || 'pending',
          customer: {
            id: actualJob.customer_id || customerData.id || '',
            name: customerData.name || actualJob.customer_name || '',
            phone: customerData.phone || actualJob.customer_phone || '',
            email: customerData.email || actualJob.customer_email || '',
            address: customerData.address || actualJob.customer_address || ''
          },
          machineCategory: actualJob.machine_category || '',
          machineBrand: actualJob.machine_brand || '',
          machineModel: actualJob.machine_model || '',
          machineSerial: actualJob.machine_serial || '',
          problemDescription: actualJob.problem_description || '',
          notes: actualJob.notes || '',
          servicePerformed: actualJob.service_performed || '',
          recommendations: actualJob.recommendations || '',
          labourHours: Number(actualJob.labour_hours) || 0,
          labourRate: Number(actualJob.labour_rate) || 95,
          labourTotal: Number(actualJob.labour_total) || 0,
          parts: [],
          grandTotal: Number(actualJob.grand_total) || 0,
          balanceDue: Number(actualJob.balance_due) || 0,
          subtotal: Number(actualJob.subtotal) || 0,
          gst: Number(actualJob.gst) || 0,
          partsSubtotal: Number(actualJob.parts_subtotal) || 0,
          createdAt: actualJob.created_at ? new Date(actualJob.created_at) : new Date(),
          updatedAt: actualJob.updated_at ? new Date(actualJob.updated_at) : new Date(),
          version: Number(actualJob.version) || 1
        } as any}
        onSave={(savedJob) => {
          console.log('[JobEdit] onSave called with:', savedJob);
          
          // Extract only changed fields
          const patch: Partial<JobDetail> = {};
          if (savedJob.notes !== actualJob.notes) patch.notes = savedJob.notes;
          if (savedJob.problemDescription !== actualJob.problem_description) patch.problem_description = savedJob.problemDescription;
          if (savedJob.servicePerformed !== actualJob.service_performed) patch.service_performed = savedJob.servicePerformed;
          if (savedJob.recommendations !== actualJob.recommendations) patch.recommendations = savedJob.recommendations;
          if (savedJob.machineCategory !== actualJob.machine_category) patch.machine_category = savedJob.machineCategory;
          if (savedJob.machineBrand !== actualJob.machine_brand) patch.machine_brand = savedJob.machineBrand;
          if (savedJob.machineModel !== actualJob.machine_model) patch.machine_model = savedJob.machineModel;
          if (savedJob.machineSerial !== actualJob.machine_serial) patch.machine_serial = savedJob.machineSerial;
          if (savedJob.status !== actualJob.status) patch.status = savedJob.status;
          if (savedJob.labourHours !== actualJob.labour_hours) patch.labour_hours = savedJob.labourHours;
          if (savedJob.labourRate !== actualJob.labour_rate) patch.labour_rate = savedJob.labourRate;
          if (savedJob.labourTotal !== actualJob.labour_total) patch.labour_total = savedJob.labourTotal;
          
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
