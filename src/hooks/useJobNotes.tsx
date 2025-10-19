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
          *
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      // Fetch user profiles separately for each note
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(n => n.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const transformedData = data.map(note => ({
          ...note,
          user_profile: profileMap.get(note.user_id)
        }));

        setNotes(transformedData as JobNote[]);
        setLoading(false);
        return;
      }

      if (error) throw error;

      setNotes(data || []);
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
        .select()
        .single();

      if (error) throw error;

      // Fetch the user profile for this note
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('user_id', user.id)
        .single();

      const noteWithProfile = {
        ...data,
        user_profile: profile || undefined
      };

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
