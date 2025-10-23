import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getJobDetailSimple } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

interface JobNote {
  id: string;
  job_id: string;
  user_id: string;
  note_text: string;
  visibility: string;
  created_at: string;
  edited_at?: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  console.log('[JobDetails] Component rendered, job ID:', id);

  // Fetch job details using RPC with timeout
  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: async () => {
      console.log('[JobDetails] queryFn called for job:', id);
      if (!id) {
        console.error('[JobDetails] No job ID provided');
        throw new Error('Job ID required');
      }
      
      console.log('[JobDetails] Calling getJobDetailSimple...');
      const data = await getJobDetailSimple(id);
      console.log('[JobDetails] getJobDetailSimple returned:', data);
      
      if (!data) {
        console.error('[JobDetails] No data returned from RPC');
        throw new Error('Job not found');
      }
      
      return data;
    },
    enabled: !!id,
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  console.log('[JobDetails] Query state:', { 
    hasData: !!job, 
    isLoading, 
    hasError: !!error,
    jobNumber: job?.job_number 
  });

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load job',
        description: (error as Error).message,
      });
    }
  }, [error, toast]);

  // Load notes initially (no realtime, manual refresh only)
  useEffect(() => {
    if (!id) return;
    loadNotes();
  }, [id]);

  const loadNotes = async () => {
    if (!id) return;
    if (isLoadingNotes) {
      console.log('[JobDetails] Notes already loading, skipping...');
      return;
    }

    console.log('[JobDetails] Loading notes for job:', id);
    setIsLoadingNotes(true);
    
    try {
      const { data, error } = await supabase
        .from('job_notes')
        .select(`
          *,
          user_profile:user_profiles(full_name, email)
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[JobDetails] Error loading notes:', error);
        throw error;
      }

      console.log('[JobDetails] Loaded notes:', data?.length || 0);

      // Flatten user_profile
      const transformedData = data?.map(note => ({
        ...note,
        user_profile: Array.isArray(note.user_profile) ? note.user_profile[0] : note.user_profile
      }));

      setNotes(transformedData || []);
    } catch (error: any) {
      console.error('[JobDetails] Error loading notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !noteText.trim()) {
      console.log('[JobDetails] Cannot add note - no user or empty text');
      return;
    }

    console.log('[JobDetails] Adding note...');
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('job_notes')
        .insert({
          job_id: id,
          user_id: user.id,
          note_text: noteText.trim(),
          visibility: 'internal',
        });

      if (error) {
        console.error('[JobDetails] Error inserting note:', error);
        throw error;
      }

      console.log('[JobDetails] Note added successfully');
      setNoteText('');
      
      // Manually reload notes after adding
      await loadNotes();
      
      toast({
        title: 'Note added',
        description: 'Staff note added successfully',
      });
    } catch (error: any) {
      console.error('[JobDetails] Error adding note:', error);
      toast({
        title: 'Error',
        description: `Failed to add note: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-semibold mb-4">Job Not Found</p>
            <p className="text-muted-foreground mb-6">
              The job you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/jobs')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/jobs')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              refetch();
              loadNotes();
              toast({ title: 'Refreshed', description: 'Job data reloaded' });
            }}
          >
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate(`/jobs/${id}/edit`)}>
            Edit Job
          </Button>
          <Badge variant={
            job.status === 'completed' ? 'default' :
            job.status === 'in_progress' ? 'secondary' :
            'outline'
          }>
            {job.status}
          </Badge>
        </div>
      </div>

      {/* Job Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Job {job.job_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {job.customer_name}</p>
              <p><strong>Phone:</strong> {job.customer_phone}</p>
              <p><strong>Email:</strong> {job.customer_email}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Machine Information</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Category:</strong> {job.machine_category}</p>
              <p><strong>Brand:</strong> {job.machine_brand}</p>
              <p><strong>Model:</strong> {job.machine_model}</p>
              {job.machine_serial && <p><strong>Serial:</strong> {job.machine_serial}</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Problem Description</h3>
            <p className="text-sm">{job.problem_description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Financial Summary</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Grand Total:</strong> ${parseFloat(job.grand_total || 0).toFixed(2)}</p>
              <p><strong>Balance Due:</strong> ${parseFloat(job.balance_due || 0).toFixed(2)}</p>
              <p><strong>Labour Hours:</strong> {job.labour_hours}</p>
              <p><strong>Labour Total:</strong> ${parseFloat(job.labour_total || 0).toFixed(2)}</p>
            </div>
          </div>

          {job.notes && (
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Note Form */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a staff note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
              disabled={isSubmitting}
            />
            <Button 
              onClick={handleAddNote}
              disabled={isSubmitting || !noteText.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>

          {/* Notes List */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet. Add one above!
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">
                        {note.user_profile?.full_name || note.user_profile?.email || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
