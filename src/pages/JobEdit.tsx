// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JobForm } from '@/components/JobForm';

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch job details using RPC
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_job_detail_simple', {
        p_job_id: id
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load job',
          description: error.message
        });
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Job not found');
      }
      
      return data[0];
    },
    retry: (failureCount, error) => {
      if (error.message === 'Job not found') return false;
      return failureCount < 3;
    },
  });

  const handleSave = async (updatedJob: any) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('jobs_db')
        .update(updatedJob)
        .eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to save job',
          description: error.message
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Job updated successfully'
      });

      navigate(`/jobs/${id}`);
    } catch (error: any) {
      console.error('Error saving job:', error);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/jobs/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Button>
        <Button onClick={() => handleSave(job)} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Edit Job {job.job_number}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm 
            initialJob={job}
            onSave={handleSave}
            onCancel={() => navigate(`/jobs/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
