import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, BarChart3, Settings, Wrench } from 'lucide-react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import JobForm from '@/components/JobForm';
import JobSearch from '@/components/JobSearch';
import { AdminSettings } from '@/components/AdminSettings';

export const JobManager = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'create-small-repair' | 'search' | 'admin'>('dashboard');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [listState, setListState] = useState<any>(null);
  const [jobType, setJobType] = useState<'service' | 'small_repair'>('service');

  const handleJobSave = (job: Job) => {
    setSelectedJob(job);
    setEditingJob(null);
    setListState(null); // Clear list state after save
    setActiveView('dashboard');
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setListState(null); // Clear list state when viewing
    setActiveView('dashboard');
  };

  const handleEditJob = (job: Job, listState: any) => {
    // Simple redirect to edit view
    window.location.href = `/?edit=${job.id}`;
  };

  const handleReturnToList = () => {
    setActiveView('search');
    // Don't clear listState, let it pass through to JobSearch
  };

  const handleCreateNew = () => {
    setEditingJob(null);
    setSelectedJob(null);
    setListState(null); // Clear list state for new job
    setJobType('service');
    setActiveView('create');
  };

  const handleCreateSmallRepair = () => {
    setEditingJob(null);
    setSelectedJob(null);
    setListState(null);
    setJobType('small_repair');
    setActiveView('create-small-repair');
  };

  if (activeView === 'create' || activeView === 'create-small-repair') {
    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={() => setActiveView('dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {editingJob ? 'Edit Job' : activeView === 'create-small-repair' ? 'Small Repair & Sharpening' : 'Service Job Booking'}
          </h1>
          <p className="text-muted-foreground">
            {editingJob ? 'Update job details and pricing' : activeView === 'create-small-repair' ? 'Quick jobs for sharpening and small repairs' : 'Create a new service booking'}
          </p>
        </div>
        <JobForm 
          job={editingJob || undefined} 
          jobType={activeView === 'create-small-repair' ? 'small_repair' : 'service'}
          onSave={handleJobSave}
          onPrint={handleSelectJob}
          onReturnToList={editingJob ? handleReturnToList : undefined}
          listState={listState}
        />
      </div>
    );
  }

  if (activeView === 'search') {
    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={() => setActiveView('dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Search & Manage Jobs
          </h1>
          <p className="text-muted-foreground">
            Find, view, edit, and print existing jobs
          </p>
        </div>
        <JobSearch 
          onSelectJob={handleSelectJob}
          onEditJob={handleEditJob}
          restoredState={activeView === 'search' ? listState : undefined}
        />
      </div>
    );
  }

  if (activeView === 'admin') {
    return <AdminSettings onClose={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary">
            Hampton Mowerpower
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-2">
          Professional Job Booking System
        </p>
        <p className="text-muted-foreground">
          Your One-Stop Shop for All Things Outdoor Power Equipment Service & Repair
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCreateNew}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Service Job Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Create a new service booking
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCreateSmallRepair}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Small Repair & Sharpening</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Quick jobs for sharpening and small repairs
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('search')}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Search Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Find existing jobs by customer, job number, or machine details
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('admin')}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Manage categories, parts, rates, and export data
            </p>
          </CardContent>
        </Card>
      </div>

      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recently Selected Job</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleEditJob(selectedJob, null)}>
                  Edit Job
                </Button>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="font-semibold">#{selectedJob.jobNumber}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.customer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedJob.customer.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold">Machine</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.machineBrand} {selectedJob.machineModel}</p>
                <p className="text-sm text-muted-foreground">{selectedJob.machineCategory}</p>
              </div>
              <div>
                <h3 className="font-semibold">Status</h3>
                <p className="text-sm text-muted-foreground capitalize">{selectedJob.status}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedJob.createdAt).toLocaleDateString('en-AU')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Total</h3>
                <p className="text-lg font-bold text-primary">{formatCurrency(selectedJob.grandTotal)}</p>
                <p className="text-sm text-muted-foreground">Inc. GST</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>Hampton Mowerpower Job Booking System</p>
        <p>Reliable service for lawn mowers, chainsaws, generators & outdoor power equipment</p>
      </div>
    </div>
  );
};