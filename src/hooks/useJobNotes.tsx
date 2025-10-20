import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface JobNote {
  id: string;
  job_id: string;
  user_id: string;
  note_text: string;
  visibility: string;
  created_at: string;
  edited_at?: string;
  created_by?: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export const useJobNotes = (jobId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load notes for the job
  const loadNotes = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_notes')
        .select(`
          *,
          user_profile:user_profiles!user_id(full_name, email, user_id)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes((data || []) as any as JobNote[]);
    } catch (error: any) {
      console.error('Error loading job notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new note
  const addNote = async (noteText: string): Promise<boolean> => {
    if (!user || !noteText.trim()) return false;

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('job_notes')
        .insert({
          job_id: jobId,
          user_id: user.id,
          note_text: noteText.trim(),
          visibility: 'internal',
        })
        .select(`
          *,
          user_profile:user_profiles!user_id(full_name, email, user_id)
        `)
        .single();

      if (error) throw error;

      const noteWithProfile = data as any as JobNote;

      // Optimistic update
      setNotes(prev => [noteWithProfile as JobNote, ...prev]);
      
      toast({
        title: 'Note added',
        description: 'Staff note added successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!jobId) return;

    loadNotes();

    const channel = supabase
      .channel(`job_notes:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_notes',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return {
    notes,
    loading,
    submitting,
    addNote,
    refresh: loadNotes,
  };
};
