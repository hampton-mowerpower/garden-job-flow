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
    if (!jobId) {
      console.warn('[StaffJobNotes] No jobId provided, skipping notes load');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_notes')
        .select(`
          *,
          user_profiles!user_id(full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes((data || []) as any as StaffNote[]);
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
    if (!jobId) {
      toast({
        title: 'Error',
        description: 'Job ID is missing. Cannot save note.',
        variant: 'destructive',
      });
      return;
    }

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

      console.log('[StaffJobNotes] Saving note for job:', jobId);

      const { error } = await supabase
        .from('job_notes')
        .insert({
          job_id: jobId,
          user_id: user.id,
          note_text: newNoteText.trim() + (selectedTags.length > 0 ? '\n\nTags: ' + selectedTags.join(', ') : ''),
          visibility: 'internal',
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
