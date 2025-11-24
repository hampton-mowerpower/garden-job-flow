import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Package, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Job } from '@/types/job';
import { JobRowActions } from './JobRowActions';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { scheduleServiceReminder } from '@/utils/reminderScheduler';
import { updateJobStatus } from '@/services/jobService';

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
    const previousStatus = job.status;
    
    // Prevent multiple simultaneous updates
    if (updatingStatus === job.id) {
      return;
    }
    
    setUpdatingStatus(job.id);
    
    // Optimistic update
    if (onUpdateJob) {
      onUpdateJob(job.id, { status: newStatus });
    }
    
    try {
      // Use simple service function
      await updateJobStatus(job.id, newStatus);
      
      // If status is delivered, schedule reminder
      if (newStatus === 'delivered') {
        const updatedJob = { ...job, status: newStatus, deliveredAt: new Date() };
        await scheduleServiceReminder(updatedJob);
      }
      
      toast({
        title: '✓ Status Updated',
        description: `${job.jobNumber} → ${newStatus.replace(/[-_]/g, ' ')}`,
      });
      
    } catch (error: any) {
      console.error('Status update failed:', error);
      
      // Revert optimistic update on error
      if (onUpdateJob) {
        onUpdateJob(job.id, { status: previousStatus });
      }
      
      toast({
        title: 'Update Failed',
        description: error.message || 'Please try again',
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
                      <p className="font-medium text-primary">{formatCurrency(job.subtotal)}</p>
                      <p>{job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-AU') : 'N/A'}</p>
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

              {/* Latest Note Preview */}
              {(job as any).latestNoteAt && (
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">
                      {new Date((job as any).latestNoteAt).toLocaleString('en-AU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {' — '}
                    <span className="line-clamp-1">{job.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )})}
    </div>
  );
}
