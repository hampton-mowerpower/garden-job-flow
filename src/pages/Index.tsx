import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Users, Wrench, TrendingUp } from 'lucide-react';
import { Job, JobBookingStats } from '@/types/job';
import { jobBookingDB } from '@/lib/storage';
import { formatCurrency } from '@/lib/calculations';
import JobForm from '@/components/JobForm';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'new-job' | 'job-list'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<JobBookingStats>({
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    averageJobValue: 0
  });
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  const initializeData = async () => {
    try {
      await jobBookingDB.init();
      const allJobs = await jobBookingDB.getAllJobs();
      const jobStats = await jobBookingDB.getJobStats();
      
      setJobs(allJobs);
      setStats(jobStats);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterJobs = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter(job =>
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.phone.includes(searchQuery) ||
      job.machineCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.machineBrand.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredJobs(filtered);
  };

  const handleJobSave = (job: Job) => {
    setJobs(prev => {
      const existing = prev.findIndex(j => j.id === job.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = job;
        return updated;
      }
      return [job, ...prev];
    });
    
    setCurrentView('dashboard');
    setSelectedJob(undefined);
    initializeData(); // Refresh stats
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in-progress': return 'warning';
      case 'completed': return 'accent';
      case 'delivered': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Booking System</h1>
          <p className="text-muted-foreground">Mower & Garden Equipment Service Management</p>
        </div>
        <Button onClick={() => setCurrentView('new-job')} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-warning" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Jobs</p>
                <p className="text-2xl font-bold">{stats.pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-accent" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Job Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageJobValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="job-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Button variant="outline" onClick={() => setCurrentView('job-list')}>
            View All Jobs
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first job booking</p>
              <Button onClick={() => setCurrentView('new-job')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedJob(job);
                    setCurrentView('new-job');
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary">{job.jobNumber}</span>
                      <Badge variant={getStatusColor(job.status) as any}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.customer.name} • {job.machineCategory} • {job.machineBrand} {job.machineModel}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(job.grandTotal)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const JobListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Jobs</h2>
          <p className="text-muted-foreground">Manage and search all job bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => setCurrentView('new-job')}>
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="form-section">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by number, customer, phone, or machine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card className="job-card">
        <CardContent className="p-0">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'No jobs created yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedJob(job);
                    setCurrentView('new-job');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-primary text-lg">{job.jobNumber}</span>
                        <Badge variant={getStatusColor(job.status) as any}>
                          {getStatusText(job.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{job.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          📞 {job.customer.phone} {job.customer.address && `• 📍 ${job.customer.address}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          🔧 {job.machineCategory} • {job.machineBrand} {job.machineModel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.problemDescription.length > 100 
                            ? `${job.problemDescription.substring(0, 100)}...`
                            : job.problemDescription
                          }
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-xl font-bold">{formatCurrency(job.grandTotal)}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      {job.completedAt && (
                        <div className="text-sm text-muted-foreground">
                          Completed: {new Date(job.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'job-list' && <JobListView />}
        {currentView === 'new-job' && (
          <JobForm 
            job={selectedJob} 
            onSave={handleJobSave}
            onPrint={(job) => console.log('Print job:', job)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
