import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Edit, Download, Trash2, RotateCcw } from 'lucide-react';
import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/calculations';
import { jobBookingDB } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobPrintLabel } from './JobPrintLabel';
import { JobPrintInvoice } from './JobPrintInvoice';
import { ThermalPrintButton } from './ThermalPrintButton';

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

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
  }, [searchQuery, jobs]);

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
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]); // Ensure jobs is always an array
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please check your connection and try refreshing.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = jobs.filter(job => 
      job.jobNumber.toLowerCase().includes(query) ||
      job.customer.name.toLowerCase().includes(query) ||
      job.customer.phone.includes(query) ||
      job.machineCategory.toLowerCase().includes(query) ||
      job.machineBrand.toLowerCase().includes(query) ||
      job.machineModel.toLowerCase().includes(query) ||
      job.problemDescription.toLowerCase().includes(query)
    );
    
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

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'delivered': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
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
        <CardContent>
          <div className="flex gap-4 mb-6">
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

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No jobs found matching your search.' : 'No jobs created yet.'}
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">#{job.jobNumber}</h3>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>Customer:</strong> {job.customer.name}</p>
                            <p><strong>Phone:</strong> {job.customer.phone}</p>
                            <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleDateString('en-AU')}</p>
                          </div>
                          <div>
                            <p><strong>Machine:</strong> {job.machineBrand} {job.machineModel}</p>
                            <p><strong>Category:</strong> {job.machineCategory}</p>
                            <p><strong>Total:</strong> <span className="font-semibold text-primary">{formatCurrency(job.grandTotal)}</span></p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm"><strong>Problem:</strong> {job.problemDescription}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
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
                        <div className="flex gap-1">
                          <JobPrintLabel job={job} />
                          <JobPrintInvoice job={job} />
                        </div>
                        <div className="flex gap-1">
                          <ThermalPrintButton job={job} type="service-label" size="sm" variant="ghost" />
                          <ThermalPrintButton job={job} type="collection-receipt" size="sm" variant="ghost" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
