import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Save, Clock } from 'lucide-react';

interface StaffNote {
  id: string;
  job_id: string;
  user_id: string;
  note_text: string;
  visibility: string;
  created_at: string;
  edited_at?: string;
  user_profiles?: {
    full_name: string;
  };
}

interface StaffJobNotesProps {
  jobId: string;
}

const QUICK_TAGS = [
  'Pickup message sent',
  'Quotation go-ahead',
  'Customer preferred pickup time',
  'Awaiting parts',
  'Called customer',
  'Left voicemail',
  'Email sent',
  'Payment received',
  'Ready for pickup',
  'Customer notified'
];

export function StaffJobNotes({ jobId }: StaffJobNotesProps) {
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [jobId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('job_notes')
        .select('*')
        .eq('job_id', jobId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map(n => n.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
      
      const notesWithProfiles = (data || []).map(note => ({
        ...note,
        user_profiles: { full_name: profileMap.get(note.user_id) || 'Unknown' }
      }));

      setNotes(notesWithProfiles);
    } catch (error) {
      console.error('Error loading staff notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff notes',
        variant: 'destructive'
      });
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim() && selectedTags.length === 0) {
      toast({
        title: 'Empty note',
        description: 'Please add text or select tags',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get tenant_id from job
      const { data: jobData } = await supabase
        .from('jobs_db')
        .select('tenant_id')
        .eq('id', jobId)
        .single();

      // Note: created_by will be set automatically by DB trigger, but we still pass user_id
      const { error } = await supabase
        .from('job_notes')
        .insert({
          job_id: jobId,
          user_id: user.id, // Keep this for TypeScript compatibility
          note_text: newNoteText.trim() + (selectedTags.length > 0 ? '\n\nTags: ' + selectedTags.join(', ') : ''),
          visibility: 'internal',
          tenant_id: jobData?.tenant_id || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Staff note saved'
      });

      setNewNoteText('');
      setSelectedTags([]);
      await loadNotes();
    } catch (error: any) {
      console.error('Error saving staff note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save staff note',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Staff Job Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Note Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add internal staff note about this job..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={3}
          />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Tags:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSaveNote}
            disabled={isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Note'}
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-3 mt-6">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No staff notes yet
            </p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className="border rounded-lg p-3 space-y-2 bg-muted/30"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">
                    {note.user_profiles?.full_name || 'Staff'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                
                {note.note_text && (
                  <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
