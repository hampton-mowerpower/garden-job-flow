import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';

interface Job {
  id: string;
  job_number: string;
  customer_name: string;
  machine_category: string;
  machine_brand: string;
  status: string;
  grand_total: number;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'waiting-parts', label: 'Waiting Parts' },
  { value: 'waiting-quote', label: 'Waiting Quote' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'write-off', label: 'Write Off' },
];

const STATUS_COLORS: Record<string, string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'waiting-parts': 'bg-orange-100 text-orange-800',
  'waiting-quote': 'bg-purple-100 text-purple-800',
  'completed': 'bg-green-100 text-green-800',
  'delivered': 'bg-gray-100 text-gray-800',
  'write-off': 'bg-red-100 text-red-800',
};

export default function JobsSimple() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const navigate = useNavigate();

  const JOBS_PER_PAGE = 25;

  useEffect(() => {
    loadJobs();
  }, [searchTerm, statusFilter, currentPage]);

  async function loadJobs() {
    console.log('[JobsSimple] Fetching jobs with:', {
      search: searchTerm || null,
      status: statusFilter === 'all' ? null : statusFilter,
      limit: JOBS_PER_PAGE,
      offset: (currentPage - 1) * JOBS_PER_PAGE,
    });
    
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_jobs_list_simple', {
      p_limit: JOBS_PER_PAGE,
      p_offset: (currentPage - 1) * JOBS_PER_PAGE,
      p_search: searchTerm || null,
      p_status: statusFilter === 'all' ? null : statusFilter,
    });

    if (rpcError) {
      console.error('[JobsSimple] Error fetching jobs:', rpcError);
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    console.log('[JobsSimple] Jobs loaded:', data?.length || 0, 'jobs');
    setJobs(data || []);
    setTotalJobs(data?.length || 0); // In production, you'd get this from a count query
    setLoading(false);
  }

  function handleSearch(value: string) {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter
  }

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  if (loading && jobs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all service jobs
          </p>
        </div>
        <Button onClick={() => navigate('/jobs-simple/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job number or customer name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Jobs Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No jobs found matching your criteria' 
                    : 'No jobs found'}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/jobs-simple/${job.id}`)}
                >
                  <TableCell className="font-medium">{job.job_number}</TableCell>
                  <TableCell>{job.customer_name || 'No customer'}</TableCell>
                  <TableCell>
                    {job.machine_brand && job.machine_category
                      ? `${job.machine_brand} ${job.machine_category}`
                      : job.machine_category || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(job.grand_total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator for subsequent loads */}
      {loading && jobs.length > 0 && (
        <div className="text-center mt-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
