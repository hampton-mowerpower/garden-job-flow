import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickProblem {
  id: string;
  label: string;
  display_order: number;
  active: boolean;
}

export const QuickProblemsAdmin: React.FC = () => {
  const { toast } = useToast();
  const [problems, setProblems] = useState<QuickProblem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProblems();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-quick-problems')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_problems'
        },
        () => loadProblems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_problems')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProblems(data || []);
    } catch (error) {
      console.error('Error loading quick problems:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quick problems',
        variant: 'destructive'
      });
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;

    try {
      const maxOrder = Math.max(...problems.map(p => p.display_order), -1);
      const { error } = await supabase
        .from('quick_problems')
        .insert({
          label: newLabel.trim(),
          display_order: maxOrder + 1,
          active: true
        });

      if (error) throw error;

      setNewLabel('');
      toast({
        title: 'Success',
        description: 'Quick problem added'
      });
    } catch (error) {
      console.error('Error adding problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to add quick problem',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async (id: string, label: string) => {
    try {
      const { error } = await supabase
        .from('quick_problems')
        .update({ label: label.trim() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quick problem',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_problems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Quick problem deleted'
      });
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quick problem',
        variant: 'destructive'
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newProblems = [...problems];
    const draggedItem = newProblems[draggedIndex];
    newProblems.splice(draggedIndex, 1);
    newProblems.splice(index, 0, draggedItem);
    
    setProblems(newProblems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    setSaving(true);
    setSaved(false);
    try {
      const updates = problems.map((problem, index) => ({
        id: problem.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('quick_problems')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save order',
        variant: 'destructive'
      });
      await loadProblems();
    } finally {
      setSaving(false);
      setDraggedIndex(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Problem Descriptions</CardTitle>
          {saving && <Badge variant="secondary">Saving...</Badge>}
          {saved && <Badge variant="default" className="bg-green-600">Saved ✓</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Enter new quick problem"
          />
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Drag to reorder • Click to edit • Syncs with New Job Booking
          </p>
          {problems.map((problem, index) => (
            <div
              key={problem.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 p-2 border rounded-lg
                transition-all hover:shadow-md cursor-move
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${!problem.active ? 'bg-muted' : ''}
              `}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={problem.label}
                onChange={(e) => {
                  const updated = [...problems];
                  updated[index].label = e.target.value;
                  setProblems(updated);
                }}
                onBlur={() => handleUpdate(problem.id, problem.label)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(problem.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
