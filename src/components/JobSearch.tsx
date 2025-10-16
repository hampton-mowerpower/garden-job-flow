import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, RotateCcw, Loader2, RefreshCw, CheckCircle, AlertTriangle, Activity, Shield, Database } from 'lucide-react';
import { Job } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomerNotificationDialog } from './CustomerNotificationDialog';
import { EmailNotificationDialog } from './EmailNotificationDialog';
import { JobStatsCards } from './jobs/JobStatsCards';
import { JobFilters } from './jobs/JobFilters';
import { JobsTableVirtualized } from './jobs/JobsTableVirtualized';
import { useJobsDirectFallback } from '@/hooks/useJobsDirectFallback';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [useDirectFallback, setUseDirectFallback] = useState(false);
  const [apiErrorCount, setApiErrorCount] = useState(0);

  // Fallback: Direct database query when REST API is down
  const { jobs: directJobs, isLoading: directLoading } = useJobsDirectFallback(25, 0, useDirectFallback);

  // Sync direct jobs to main state
  useEffect(() => {
    if (useDirectFallback && directJobs.length > 0) {
      setJobs(directJobs);
      setIsLoading(false);
    }
  }, [useDirectFallback, directJobs]);

  // Show fallback error if RPC fails
  useEffect(() => {
    if (useDirectFallback && directLoading === false && directJobs.length === 0) {
      // Check if there's an error from the fallback hook
      const { error: fallbackError } = useJobsDirectFallback(25, 0, true);
      if (fallbackError) {
        toast({
          title: '🚨 Fallback Failed',
          description: 'Direct database query failed. Run RECOVERY_SAFE.sql immediately.',
          variant: 'destructive',
          duration: 0, // Don't auto-dismiss
        });
      }
    }
  }, [useDirectFallback, directLoading, directJobs, toast]);

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

  // Initial load
  useEffect(() => {
    if (!restoredState) {
      loadJobsPage(true);
    }
  }, [activeFilter]);

  // Debounce search query (300ms for better responsiveness)
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

      // Use direct query instead of RPC to avoid schema cache issues
      let query = supabase
        .from('jobs_db')
        .select(`
          id,
          job_number,
          status,
          created_at,
          grand_total,
          customer_id,
          machine_category,
          machine_brand,
          machine_model,
          machine_serial,
          problem_description,
          balance_due,
          customers_db!inner(
            name,
            phone,
            email
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!isInitial && cursor) {
        query = query.lt('created_at', cursor);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const fetchPromise = query;
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

      // Convert to Job objects - extract customer data from nested object
      const newJobs = data.map((row: any) => {
        const job = convertToJob(row);
        return {
          ...job,
          customer: {
            ...job.customer,
            name: row.customers_db?.name || 'Unknown',
            phone: row.customers_db?.phone || '',
            email: row.customers_db?.email || ''
          }
        };
      });

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
      
      const isSchemaError = err.message?.includes('schema cache') || 
                           err.code === 'PGRST002' ||
                           err.message?.includes('Could not query the database');
      
      if (isSchemaError) {
        // Activate fallback immediately on PGRST002
        setUseDirectFallback(true);
        toast({
          title: '⚠️ Using Fallback Mode',
          description: 'PostgREST schema cache error. Switched to direct database query. Admin: Run RECOVERY_SAFE.sql in SQL Editor.',
          variant: 'destructive',
          duration: 15000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load jobs',
          description: err.message || 'Please try again'
        });
      }
    } finally {
      setLoadingState(false);
    }
  }, [isLoading, isLoadingMore, cursor, activeFilter, isSearchMode, convertToJob, refreshStats, toast]);

  // Fast unified search function using new search_jobs_unified RPC
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
      console.log('🔍 Searching for:', term);

      // Use direct query with ILIKE for better reliability
      const searchTerm = term.toLowerCase();
      const { data, error } = await supabase
        .from('jobs_db')
        .select(`
          id,
          job_number,
          status,
          created_at,
          grand_total,
          customer_id,
          machine_category,
          machine_brand,
          machine_model,
          machine_serial,
          problem_description,
          balance_due,
          customers_db!inner(
            name,
            phone,
            email
          )
        `)
        .is('deleted_at', null)
        .or(`job_number.ilike.%${searchTerm}%,machine_model.ilike.%${searchTerm}%,machine_brand.ilike.%${searchTerm}%,machine_serial.ilike.%${searchTerm}%,customers_db.name.ilike.%${searchTerm}%,customers_db.phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      const searchTime = performance.now() - startTime;
      console.log(`✅ Search completed in ${searchTime.toFixed(0)}ms, found ${data?.length || 0} results`);

      if (error) {
        console.error('❌ Search error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('📭 No results found for:', term);
        setJobs([]);
        setHasMore(false);
        toast({
          title: 'No results found',
          description: `Try searching by job number (e.g., "JB2025-0061", "0061", "61"), customer name, phone, or machine model.`,
        });
        return;
      }

      const searchResults = data.map((row: any) => {
        const job = convertToJob(row);
        return {
          ...job,
          customer: {
            ...job.customer,
            name: row.customers_db?.name || 'Unknown',
            phone: row.customers_db?.phone || '',
            email: row.customers_db?.email || ''
          }
        };
      });
      setJobs(searchResults);
      setHasMore(false);

      console.log('✅ Search results loaded:', searchResults.length);

    } catch (err: any) {
      console.error('❌ Search failed:', err);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: err.message || 'Please try again'
      });
      setJobs([]);
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
  };

  return (
    <div className="space-y-6">
      {useDirectFallback && (
        <Alert className="border-red-600 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-700" />
          <AlertDescription>
            <div className="space-y-2">
              <strong className="text-red-900 text-base">🚨 CRITICAL: Database API Down - Fallback Mode Active</strong>
              <p className="text-sm text-red-800 font-medium">
                PostgREST schema cache error (PGRST002). Jobs will load via direct query once you run RECOVERY_SAFE.sql.
              </p>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => window.open('https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new', '_blank')}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  → Open SQL Editor
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.querySelector('[data-system-doctor]');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="gap-2"
                >
                  View System Doctor
                </Button>
              </div>
              <p className="text-xs text-red-700 mt-2">
                Instructions: Copy RECOVERY_SAFE.sql code → Paste in SQL Editor → Run → Refresh page
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                placeholder="Search: job# (0061), customer name, phone (0422), model (hru19), serial..."
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
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">
                {searchQuery ? 'No jobs found matching your search.' : 'No jobs created yet.'}
              </p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  <strong>Search tips:</strong> Try "JB2025-0061", "0061", "61", customer name "mark sm", phone "0422", or model "hru19"
                </p>
              )}
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
