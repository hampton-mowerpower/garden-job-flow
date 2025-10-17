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
import { jobBookingDB } from '@/lib/storage';

interface JobSearchProps {
  onSelectJob: (job: Job) => void;
  onEditJob: (job: Job, listState: any) => void;
  restoredState?: {
    filters: any;
    pagination: any;
    scrollY: number;
    jobId: string;
  };
}

interface SearchPrefs {
  searchQuery: string;
  sortBy: string;
  filterStatus: string;
}

const PAGE_SIZE = 25;
const API_TIMEOUT = 10000;

// Customer data now included in RPC response

export default function JobSearch({ onSelectJob, onEditJob, restoredState }: JobSearchProps) {
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
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);

  // Handler to update a specific job in the list without refetching
  const handleUpdateJob = useCallback((jobId: string, updates: Partial<Job>) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, ...updates }
          : job
      )
    );
  }, []);

  // Restore state if coming back from edit
  useEffect(() => {
    if (restoredState) {
      console.log('Restoring list state:', restoredState);
      setActiveFilter(restoredState.filters?.status || 'all');
      setSearchQuery(restoredState.filters?.search || '');
      setCursor(restoredState.pagination?.cursor || null);
      setHighlightedJobId(restoredState.jobId);
      
      // Restore scroll position after render
      setTimeout(() => {
        if (restoredState.scrollY) {
          window.scrollTo(0, restoredState.scrollY);
        }
        // Scroll to and highlight the edited job
        const jobElement = document.getElementById(`job-row-${restoredState.jobId}`);
        if (jobElement) {
          jobElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          // Remove highlight after animation
          setTimeout(() => setHighlightedJobId(null), 2000);
        }
      }, 100);
    }
  }, [restoredState]);

  // DISABLED: Auto-loading jobs on mount to prevent connection pool exhaustion
  // Jobs will only be loaded when user clicks a filter or searches
  // This prevents unnecessary database connections on page load
  
  // Initial load with cleanup - ONLY if restored state exists
  useEffect(() => {
    if (restoredState) {
      const abortController = new AbortController();
      loadJobsPage(true, abortController.signal);
      
      return () => {
        abortController.abort();
      };
    }
  }, [restoredState]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute search when debounced value changes with cleanup
  useEffect(() => {
    const abortController = new AbortController();
    
    if (debouncedSearch.trim()) {
      handleSearch(debouncedSearch, abortController.signal);
    } else {
      setIsSearchMode(false);
      loadJobsPage(true, abortController.signal);
    }
    
    // Cleanup: abort pending search on unmount or search change
    return () => {
      abortController.abort();
    };
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

  // Main load function with pagination with abort controller
  const loadJobsPage = useCallback(async (isInitial = false, signal?: AbortSignal) => {
    if ((isInitial ? isLoading : isLoadingMore) || isSearchMode) return;

    const setLoadingState = isInitial ? setIsLoading : setIsLoadingMore;
    setLoadingState(true);
    const startTime = performance.now();

    try {
      const statusFilter = activeFilter !== 'all' && 
                          !['today', 'week', 'month', 'year', 'open', 'parts', 'quote'].includes(activeFilter)
        ? activeFilter
        : null;

      const { data, error } = await supabase.rpc('list_jobs_page', {
        p_limit: PAGE_SIZE,
        p_before: isInitial ? null : cursor,
        p_status: statusFilter
      }).abortSignal(signal || AbortSignal.timeout(API_TIMEOUT));

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

  // Fast search function with abort controller
  const handleSearch = useCallback(async (term: string, signal?: AbortSignal) => {
    if (!term.trim()) {
      setIsSearchMode(false);
      loadJobsPage(true, signal);
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
        }).abortSignal(signal || AbortSignal.timeout(API_TIMEOUT));
      } else if (term.toUpperCase().startsWith('JB')) {
        // Job number search
        result = await supabase.rpc('search_job_by_number', {
          p_job_number: term.toUpperCase()
        }).abortSignal(signal || AbortSignal.timeout(API_TIMEOUT));
      } else {
        // Customer name search
        result = await supabase.rpc('search_jobs_by_customer_name', {
          p_name: term,
          p_limit: 50
        }).abortSignal(signal || AbortSignal.timeout(API_TIMEOUT));
      }

      const searchTime = performance.now() - startTime;
      console.log(`Search completed in ${searchTime.toFixed(0)}ms`);

      if (result.error) throw result.error;

      const searchResults = (result.data || []).map((row: any) => convertToJob(row));
      setJobs(searchResults);
      setHasMore(false);

    } catch (err: any) {
      // Don't show errors for aborted queries
      if (err?.name === 'AbortError' || signal?.aborted) {
        return;
      }
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

  // Fetch full job data before editing
  const handleEditClick = async (job: Job) => {
    try {
      setIsLoading(true);
      console.log('Fetching full job data for editing:', job.id);
      
      // Fetch complete job data from database
      const fullJob = await jobBookingDB.getJob(job.id);
      
      if (!fullJob) {
        toast({
          title: 'Error',
          description: 'Job not found',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Full job data loaded:', {
        category: fullJob.machineCategory,
        brand: fullJob.machineBrand,
        model: fullJob.machineModel
      });
      
      // Capture current list state
      const listState = {
        from: 'jobs_list' as const,
        filters: {
          search: searchQuery,
          status: activeFilter
        },
        pagination: {
          cursor,
          pageSize: PAGE_SIZE
        },
        scrollY: window.scrollY,
        jobId: job.id
      };
      
      // Pass complete job data and list state to edit handler
      onEditJob(fullJob, listState);
      
    } catch (error: any) {
      console.error('Error loading job for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
    // Trigger load when user clicks a filter
    loadJobsPage(true);
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

          <JobFilters activeFilter={activeFilter} onFilterChange={handleFilterClick} />

          {jobs.length === 0 && !isLoading && !searchQuery ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Click a filter above or use the search bar to load jobs
              </p>
              <Button onClick={() => handleFilterClick('all')} size="lg">
                Load All Jobs
              </Button>
            </div>
          ) : isLoading && jobs.length === 0 ? (
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
          onEditJob={handleEditClick}
          onDeleteJob={handleDeleteJob}
          onNotifyCustomer={(job) => setNotificationJob(job)}
          onSendEmail={(job) => setEmailJob(job)}
          highlightedJobId={highlightedJobId}
          onUpdateJob={handleUpdateJob}
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
