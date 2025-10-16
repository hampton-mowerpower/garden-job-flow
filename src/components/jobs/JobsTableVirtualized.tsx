import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Package, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Job } from '@/types/job';
import { JobRowActions } from './JobRowActions';
import { JobInlineNotes } from './JobInlineNotes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { scheduleServiceReminder } from '@/utils/reminderScheduler';

interface JobsTableVirtualizedProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (job: Job) => void;
  onNotifyCustomer: (job: Job) => void;
  onSendEmail: (job: Job) => void;
  highlightedJobId?: string | null;
  onUpdateJob?: (jobId: string, updates: Partial<Job>) => void;
}

export function JobsTableVirtualized({ 
  jobs, 
  onSelectJob, 
  onEditJob, 
  onDeleteJob,
  onNotifyCustomer,
  onSendEmail,
  highlightedJobId,
  onUpdateJob 
}: JobsTableVirtualizedProps) {
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const handleStatusChange = async (job: Job, newStatus: Job['status']) => {
    // Prevent no-op updates
    if (job.status === newStatus) {
      return;
    }

    const previousStatus = job.status;
    const previousVersion = job.version || 1;
    setUpdatingStatus(job.id);
    
    // Optimistic update
    if (onUpdateJob) {
      onUpdateJob(job.id, { status: newStatus, version: previousVersion + 1 });
    }
    
    try {
      console.log(`Updating job ${job.jobNumber} status: ${previousStatus} → ${newStatus} (v${previousVersion})`);
      
      const updates: any = {
        status: newStatus,
        version: previousVersion + 1,
        updated_at: new Date().toISOString()
      };
      
      // Set timestamps based on status
      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      // Update with version check for concurrency - use maybeSingle to handle 0 rows
      const { data, error } = await supabase
        .from('jobs_db')
        .update(updates)
        .eq('id', job.id)
        .eq('version', previousVersion)
        .select('id, version, status, updated_at')
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Check if update succeeded (data will be null if no rows matched)
      if (!data) {
        console.warn('Version conflict: job was modified by another user');
        throw new Error('This job was modified by another user. Please refresh the page and try again.');
      }
      
      console.log(`✓ Status updated successfully to ${data.status} (v${data.version})`);
      
      // Update local state with confirmed data from server
      if (onUpdateJob) {
        onUpdateJob(job.id, { 
          status: data.status as Job['status'],
          version: data.version,
          updatedAt: new Date(data.updated_at)
        });
      }
      
      // Schedule reminder if delivered
      if (newStatus === 'delivered') {
        const updatedJob = { ...job, status: newStatus, deliveredAt: new Date() };
        await scheduleServiceReminder(updatedJob);
      }
      
      toast({
        title: 'Status Updated',
        description: `Job ${job.jobNumber} marked as ${newStatus.replace(/[_-]/g, ' ')}`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Revert optimistic update to previous state
      if (onUpdateJob) {
        onUpdateJob(job.id, { 
          status: previousStatus, 
          version: previousVersion 
        });
      }
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to update job status';
      
      if (error.message && error.message.includes('modified by another user')) {
        errorMessage = error.message;
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Job was modified by another user. Please refresh and try again.';
      } else if (error.code === '42501') {
        errorMessage = 'You do not have permission to update this job.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };
  
  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'delivered': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'write_off': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const hasWaitingParts = (job: Job) => {
    // Check if job has parts marked as awaiting stock
    return job.parts?.some(p => (p as any).awaiting_stock) || false;
  };

  const hasQuotePending = (job: Job) => {
    return (job as any).quotation_status === 'pending';
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const isHighlighted = highlightedJobId === job.id;
        return (
          <Card 
            key={job.id} 
            id={`job-row-${job.id}`}
            className={`hover:shadow-md transition-all ${
              isHighlighted 
                ? 'ring-2 ring-primary shadow-lg animate-pulse' 
                : ''
            }`}
          >
            <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with Job Info and Action Buttons */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">#{job.jobNumber}</h3>
                    
                    {/* Inline Status Editor */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={job.status}
                        onValueChange={(value) => handleStatusChange(job, value as Job['status'])}
                        disabled={updatingStatus === job.id}
                      >
                        <SelectTrigger className={`w-[160px] h-7 ${getStatusColor(job.status)} border`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                          <SelectItem value="awaiting_quote">Awaiting Quote</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="write_off">Write Off</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingStatus === job.id && (
                        <span className="text-xs text-muted-foreground animate-pulse">
                          Saving...
                        </span>
                      )}
                    </div>
                    {hasWaitingParts(job) && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Package className="h-3 w-3 mr-1" />
                        Parts
                      </Badge>
                    )}
                    {hasQuotePending(job) && (
                      <Badge className="bg-cyan-100 text-cyan-800">
                        <FileText className="h-3 w-3 mr-1" />
                        Quote
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{job.customer.name}</p>
                      {job.jobCompanyName && (
                        <p className="text-xs">({job.jobCompanyName})</p>
                      )}
                      <p>{job.customer.phone}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {job.machineBrand} {job.machineModel}
                      </p>
                      <p>{job.machineCategory}</p>
                    </div>
                    <div>
                      <p className="font-medium text-primary">{formatCurrency(job.grandTotal)}</p>
                      <p>{new Date(job.createdAt).toLocaleDateString('en-AU')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Row Actions */}
                  <JobRowActions
                    job={job}
                    onNotifyCustomer={onNotifyCustomer}
                    onSendEmail={onSendEmail}
                  />

                  {/* Main Action Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectJob(job)}
                      className="gap-1 flex-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditJob(job)}
                      className="gap-1 flex-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteJob(job)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Inline Staff Notes */}
              <div className="border-t pt-3">
                <JobInlineNotes jobId={job.id} />
              </div>
            </div>
          </CardContent>
        </Card>
      )})}
    </div>
  );
}
