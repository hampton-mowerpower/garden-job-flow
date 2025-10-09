import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, RotateCcw } from 'lucide-react';
import { Job } from '@/types/job';
import { jobBookingDB } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerNotificationDialog } from './CustomerNotificationDialog';
import { EmailNotificationDialog } from './EmailNotificationDialog';
import { JobStatsCards } from './jobs/JobStatsCards';
import { JobFilters } from './jobs/JobFilters';
import { JobsTableVirtualized } from './jobs/JobsTableVirtualized';
import { useJobStats } from '@/hooks/useJobStats';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

interface JobSearchProps {
  onSelectJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
}

interface SearchPrefs {
  searchQuery: string;
  sortBy: string;
  filterStatus: string;
}

export default function JobSearch({ onSelectJob, onEditJob }: JobSearchProps) {
  const { toast } = useToast();
  const { stats, refresh: refreshStats } = useJobStats();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [notificationJob, setNotificationJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);

  // Load search preferences from database
  useEffect(() => {
    loadSearchPreferences();
  }, []);

  // Save search preferences to database (debounced)
  useEffect(() => {
    if (!prefsLoaded) return; // Don't save until initial load is complete
    
    const timer = setTimeout(() => {
      saveSearchPreferences();
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, prefsLoaded]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, jobs, activeFilter]);

  const loadSearchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPrefsLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from('job_search_prefs')
        .select('prefs')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.prefs) {
        const prefs = data.prefs as unknown as SearchPrefs;
        setSearchQuery(prefs.searchQuery || '');
      }
    } catch (error) {
      console.error('Error loading search preferences:', error);
    } finally {
      setPrefsLoaded(true);
    }
  };

  const saveSearchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const prefs: SearchPrefs = {
        searchQuery,
        sortBy: 'date',
        filterStatus: 'all'
      };

      const { error } = await supabase
        .from('job_search_prefs')
        .upsert({
          user_id: user.id,
          prefs: prefs as any
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  };

  const resetPreferences = async () => {
    setSearchQuery('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('job_search_prefs')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: 'Reset complete',
        description: 'Search preferences have been reset'
      });
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setJobs([]);
        setIsLoading(false);
        return;
      }
      
      const allJobs = await jobBookingDB.getAllJobs();
      setJobs((allJobs || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      refreshStats();
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please check your connection and try refreshing.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = async () => {
    let filtered = jobs;

    // Apply time-based filter
    const now = new Date();
    if (activeFilter === 'today') {
      const todayStart = startOfDay(now);
      filtered = filtered.filter(j => new Date(j.createdAt) >= todayStart);
    } else if (activeFilter === 'week') {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      filtered = filtered.filter(j => new Date(j.createdAt) >= weekStart);
    } else if (activeFilter === 'month') {
      const monthStart = startOfMonth(now);
      filtered = filtered.filter(j => new Date(j.createdAt) >= monthStart);
    } else if (activeFilter === 'year') {
      const yearStart = startOfYear(now);
      filtered = filtered.filter(j => new Date(j.createdAt) >= yearStart);
    } else if (activeFilter === 'open') {
      filtered = filtered.filter(j => j.status === 'pending' || j.status === 'in-progress');
    } else if (activeFilter === 'parts') {
      // Get jobs with awaiting parts
      const { data: partsData } = await supabase
        .from('job_parts')
        .select('job_id')
        .eq('awaiting_stock', true);
      const partsJobIds = new Set(partsData?.map(p => p.job_id) || []);
      filtered = filtered.filter(j => partsJobIds.has(j.id));
    } else if (activeFilter === 'quote') {
      filtered = filtered.filter(j => (j as any).quotation_status === 'pending');
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(j => j.status === activeFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.jobNumber.toLowerCase().includes(query) ||
        job.customer.name.toLowerCase().includes(query) ||
        job.customer.phone.includes(query) ||
        job.machineCategory.toLowerCase().includes(query) ||
        job.machineBrand.toLowerCase().includes(query) ||
        job.machineModel.toLowerCase().includes(query) ||
        job.problemDescription.toLowerCase().includes(query)
      );
    }
    
    setFilteredJobs(filtered);
  };

  const handleExportJobs = () => {
    const dataStr = JSON.stringify(jobs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hampton-mowerpower-jobs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Success',
      description: 'Jobs exported successfully'
    });
  };

  const handleDeleteJob = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete job ${job.jobNumber}?`)) {
      return;
    }

    try {
      await jobBookingDB.deleteJob(job.id);
      await loadJobs();
      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive'
      });
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading jobs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <JobStatsCards stats={stats} onFilterClick={handleFilterClick} />

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Search & Management</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetPreferences} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJobs} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job number, customer name, phone, or machine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <JobFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || activeFilter !== 'all' ? 'No jobs found matching your criteria.' : 'No jobs created yet.'}
            </div>
          ) : (
            <JobsTableVirtualized
              jobs={filteredJobs}
              onSelectJob={onSelectJob}
              onEditJob={onEditJob}
              onDeleteJob={handleDeleteJob}
            />
          )}
        </CardContent>
      </Card>

      {/* Customer Notification Dialog */}
      {notificationJob && (
        <CustomerNotificationDialog
          job={notificationJob}
          open={!!notificationJob}
          onOpenChange={(open) => !open && setNotificationJob(null)}
        />
      )}

      {/* Email Notification Dialog */}
      {emailJob && (
        <EmailNotificationDialog
          job={emailJob}
          open={!!emailJob}
          onOpenChange={(open) => !open && setEmailJob(null)}
        />
      )}
    </div>
  );
}
