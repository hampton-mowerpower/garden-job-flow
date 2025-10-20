import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, RotateCcw, Loader2 } from 'lucide-react';
import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { getJobsListSimple } from '@/lib/api';
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
  const navigate = useNavigate();
  const { stats, refresh: refreshStats } = useJobStats();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [notificationJob, setNotificationJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);

  // Use React Query for jobs list
  const { data: rawJobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', page, activeFilter],
    queryFn: async () => {
      const data = await getJobsListSimple(25, page * 25);
      return data;
    },
    staleTime: 15_000,
    retry: 1,
    enabled: !isSearchMode,
  });

  // Convert to Job format
  const jobs = rawJobs.map((row) => convertToJob(row));

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: 'destructive',
        title: 'Failed to load jobs',
        description: errorMsg,
      });
    }
  }, [error, toast]);


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
      refetch();
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
        address: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      customerId: row.customer_id || '',
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
      notes: row.latest_note_text || '',
      latestNoteAt: row.latest_note_at,
      updatedAt: new Date(row.created_at)
    } as Job & { latestNoteAt?: string };
  }, []);


  // Fast search function (removed realtime, using direct query)
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setIsSearchMode(false);
      refetch();
      return;
    }

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

      if (result.error) throw result.error;

      // Note: Search results handled separately from main query
      console.log('Search completed, results:', result.data?.length || 0);

    } catch (err: any) {
      console.error('Search error:', err);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: err.message
      });
    }
  }, [convertToJob, toast]);

  const resetSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setIsSearchMode(false);
    setPage(0);
    refetch();
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

  // Navigate to edit page directly
  const handleEditClick = (job: Job) => {
    navigate(`/jobs/${job.id}/edit`);
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

      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      });

      refreshStats();
      refetch();
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
    setPage(0);
    refetch();
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
            <JobsTableVirtualized
              jobs={jobs}
              onSelectJob={(job) => navigate(`/jobs/${job.id}`)}
              onEditJob={handleEditClick}
              onDeleteJob={handleDeleteJob}
              onNotifyCustomer={(job) => setNotificationJob(job)}
              onSendEmail={(job) => setEmailJob(job)}
              highlightedJobId={highlightedJobId}
              onUpdateJob={() => refetch()}
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
