import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Loader2, MessageSquare } from 'lucide-react';
import { useJobNotes } from '@/hooks/useJobNotes';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface JobInlineNotesProps {
  jobId: string;
}

export function JobInlineNotes({ jobId }: JobInlineNotesProps) {
  const { notes, loading, submitting, addNote } = useJobNotes(jobId);
  const [noteText, setNoteText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!noteText.trim() || submitting) return;

    const success = await addNote(noteText);
    if (success) {
      setNoteText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const recentNotes = notes.slice(0, 2);
  const hasMoreNotes = notes.length > 2;

  return (
    <div className="space-y-2">
      {/* Recent notes preview */}
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading notes...
          </div>
        ) : recentNotes.length > 0 ? (
          <>
            {recentNotes.map((note) => (
              <div key={note.id} className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
                {' — '}
                <span className="font-medium">
                  {note.user_profile?.full_name || 'Staff'}:
                </span>
                {' '}
                <span className="line-clamp-1">{note.note_text}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            No notes yet
          </div>
        )}
      </div>

      {/* View all notes collapsible */}
      {hasMoreNotes && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide older notes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View all {notes.length} notes
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="pb-2 border-b last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {note.user_profile?.full_name || 'Staff'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs">{note.note_text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Add note composer */}
      <div className="flex gap-2">
        <Input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add internal note..."
          disabled={submitting}
          className="h-8 text-xs"
        />
        <Button
          onClick={handleSubmit}
          disabled={!noteText.trim() || submitting}
          size="sm"
          className="h-8 px-3"
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Add'
          )}
        </Button>
      </div>
    </div>
  );
}
