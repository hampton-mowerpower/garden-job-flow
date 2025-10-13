import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, RotateCcw, Loader2 } from 'lucide-react';
import { Job } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerNotificationDialog } from './CustomerNotificationDialog';
import { EmailNotificationDialog } from './EmailNotificationDialog';
import { JobStatsCards } from './jobs/JobStatsCards';
import { JobFilters } from './jobs/JobFilters';
import { JobsTableVirtualized } from './jobs/JobsTableVirtualized';
import { useJobStats } from '@/hooks/useJobStats';
import { Skeleton } from '@/components/ui/skeleton';

interface JobSearchProps {
  onSelectJob: (job: Job) => void;
  onEditJob: (job: Job) => void;
}

interface SearchPrefs {
  searchQuery: string;
  sortBy: string;
  filterStatus: string;
}

const PAGE_SIZE = 25;
const API_TIMEOUT = 10000;

// Customer data now included in RPC response

export default function JobSearch({ onSelectJob, onEditJob }: JobSearchProps) {
  const { toast } = useToast();
  const { stats, refresh: refreshStats } = useJobStats();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [notificationJob, setNotificationJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Initial load
  useEffect(() => {
    loadJobsPage(true);
  }, [activeFilter]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute search when debounced value changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      handleSearch(debouncedSearch);
    } else {
      setIsSearchMode(false);
      loadJobsPage(true);
    }
  }, [debouncedSearch]);

  // Convert DB row to Job type - customer data now included in RPC
  const convertToJob = useCallback((row: any): Job => {
    return {
      id: row.id,
      jobNumber: row.job_number,
      status: row.status,
      createdAt: row.created_at,
      grandTotal: parseFloat(row.grand_total || 0),
      customer: {
        id: row.customer_id,
        name: row.customer_name || 'Unknown',
        phone: row.customer_phone || '',
        email: row.customer_email || '',
        address: ''
      },
      machineCategory: row.machine_category || '',
      machineBrand: row.machine_brand || '',
      machineModel: row.machine_model || '',
      machineSerial: row.machine_serial || '',
      problemDescription: row.problem_description || '',
      balanceDue: parseFloat(row.balance_due || 0),
      parts: [],
      labourHours: 0,
      labourRate: 0,
      labourTotal: 0,
      partsSubtotal: 0,
      subtotal: 0,
      gst: 0,
      notes: ''
    } as Job;
  }, []);

  // Customer data now included in RPC - no need to load separately

  // Main load function with pagination
  const loadJobsPage = useCallback(async (isInitial = false) => {
    if ((isInitial ? isLoading : isLoadingMore) || isSearchMode) return;

    const setLoadingState = isInitial ? setIsLoading : setIsLoadingMore;
    setLoadingState(true);
    const startTime = performance.now();

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT)
      );

      const statusFilter = activeFilter !== 'all' && 
                          !['today', 'week', 'month', 'year', 'open', 'parts', 'quote'].includes(activeFilter)
        ? activeFilter
        : null;

      const fetchPromise = supabase.rpc('list_jobs_page', {
        p_limit: PAGE_SIZE,
        p_before: isInitial ? null : cursor,
        p_status: statusFilter
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      const loadTime = performance.now() - startTime;
      console.log(`Jobs loaded in ${loadTime.toFixed(0)}ms`);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasMore(false);
        if (isInitial) {
          setJobs([]);
          toast({
            title: 'No jobs found',
            description: 'There are no jobs in the system yet.'
          });
        }
        return;
      }

      // Convert to Job objects - customer data already included
      const newJobs = data.map((row: any) => convertToJob(row));

      setJobs(prev => isInitial ? newJobs : [...prev, ...newJobs]);

      if (data.length === PAGE_SIZE) {
        setCursor(data[data.length - 1].created_at);
        setHasMore(true);
      } else {
        setHasMore(false);
      }

      if (isInitial) refreshStats();

    } catch (err: any) {
      console.error('Load jobs error:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to load jobs',
        description: err.message || 'Please try again',
        action: (
          <Button variant="outline" size="sm" onClick={() => loadJobsPage(isInitial)}>
            Retry
          </Button>
        )
      });
    } finally {
      setLoadingState(false);
    }
  }, [isLoading, isLoadingMore, cursor, activeFilter, isSearchMode, convertToJob, refreshStats, toast]);

  // Fast search function
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setIsSearchMode(false);
      loadJobsPage(true);
      return;
    }

    setIsLoading(true);
    setIsSearchMode(true);
    const startTime = performance.now();

    try {
      let result;

      // Check if it's a phone number (digits only)
      if (/^\d+$/.test(term)) {
        result = await supabase.rpc('search_jobs_by_phone', {
          p_phone: term,
          p_limit: 50
        });
      } else if (term.toUpperCase().startsWith('JB')) {
        // Job number search
        result = await supabase.rpc('search_job_by_number', {
          p_job_number: term.toUpperCase()
        });
      } else {
        // Customer name search
        result = await supabase.rpc('search_jobs_by_customer_name', {
          p_name: term,
          p_limit: 50
        });
      }

      const searchTime = performance.now() - startTime;
      console.log(`Search completed in ${searchTime.toFixed(0)}ms`);

      if (result.error) throw result.error;

      const searchResults = (result.data || []).map((row: any) => convertToJob(row));
      setJobs(searchResults);
      setHasMore(false);

    } catch (err: any) {
      console.error('Search error:', err);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [convertToJob, loadJobsPage, toast]);

  const resetSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setIsSearchMode(false);
    loadJobsPage(true);
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
      const { error } = await supabase
        .from('jobs_db')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', job.id);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== job.id));

      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      });

      refreshStats();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    setSearchQuery('');
    setIsSearchMode(false);
  };

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
              <Button variant="outline" size="sm" onClick={resetSearch} className="gap-2">
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
                placeholder="Search by job number, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={resetSearch}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          <JobFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {isLoading && jobs.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No jobs found matching your search.' : 'No jobs created yet.'}
            </div>
          ) : (
            <>
              <JobsTableVirtualized
                jobs={jobs}
                onSelectJob={onSelectJob}
                onEditJob={onEditJob}
                onDeleteJob={handleDeleteJob}
                onNotifyCustomer={(job) => setNotificationJob(job)}
                onSendEmail={(job) => setEmailJob(job)}
              />
              
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!isSearchMode && hasMore && !isLoadingMore && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => loadJobsPage(false)}
                    variant="outline"
                  >
                    Load More Jobs
                  </Button>
                </div>
              )}
            </>
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
