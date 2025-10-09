import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Package, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Job } from '@/types/job';

interface JobsTableVirtualizedProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (job: Job) => void;
}

export function JobsTableVirtualized({ jobs, onSelectJob, onEditJob, onDeleteJob }: JobsTableVirtualizedProps) {
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
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">#{job.jobNumber}</h3>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.slice(1).replace('_', ' ')}
                  </Badge>
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

              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectJob(job)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditJob(job)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteJob(job)}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
