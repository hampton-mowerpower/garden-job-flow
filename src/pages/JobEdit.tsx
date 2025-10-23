// @ts-nocheck
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

      toast({
        title: 'Success',
        description: 'Job updated successfully'
      });

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

  // Extract actual job and customer data from the nested response
  const actualJob = job.job || job;
  const customerData = job.customer || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/jobs/${id}`)} className="gap-2">
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
            id: actualJob.customer_id || customerData.id,
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
          labourHours: actualJob.labour_hours || 0,
          labourRate: actualJob.labour_rate || 95,
          labourTotal: actualJob.labour_total || 0,
          parts: [],
          grandTotal: actualJob.grand_total || 0,
          balanceDue: actualJob.balance_due || 0,
          subtotal: actualJob.subtotal || 0,
          gst: actualJob.gst || 0,
          partsSubtotal: actualJob.parts_subtotal || 0,
          createdAt: actualJob.created_at ? new Date(actualJob.created_at) : new Date(),
          updatedAt: actualJob.updated_at ? new Date(actualJob.updated_at) : new Date(),
          version: actualJob.version || 1
        } as any}
        onSave={(savedJob) => {
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
          
          handleSave(patch, savedJob.version || 1);
        }}
        onReturnToList={() => navigate(`/jobs/${id}`)}
      />
    </div>
  );
}
