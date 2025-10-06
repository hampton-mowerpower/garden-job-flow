import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickProblem {
  id: string;
  label: string;
  display_order: number;
  active: boolean;
}

interface DraggableQuickProblemsProps {
  onSelect: (label: string) => void;
  selectedProblems?: string[];
}

export const DraggableQuickProblems: React.FC<DraggableQuickProblemsProps> = ({
  onSelect,
  selectedProblems = []
}) => {
  const { toast } = useToast();
  const [problems, setProblems] = useState<QuickProblem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_problems')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProblems(data || []);
    } catch (error) {
      console.error('Error loading quick problems:', error);
      // Fallback to default
      setProblems([
        { id: '1', label: 'Full Service Required', display_order: 0, active: true },
        { id: '2', label: 'Blade Sharpen', display_order: 1, active: true },
        { id: '3', label: "Won't Start", display_order: 2, active: true },
        { id: '4', label: 'Runs Rough', display_order: 3, active: true }
      ]);
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
    try {
      // Update display_order for all items
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

      toast({
        title: 'Saved ✓',
        description: 'Quick problems order updated'
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save order',
        variant: 'destructive'
      });
      // Reload to revert
      await loadProblems();
    } finally {
      setSaving(false);
      setDraggedIndex(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Quick Problems</label>
        {saving && <Badge variant="secondary">Saving...</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">Drag to reorder • Click to add to description</p>
      <div className="flex flex-wrap gap-2">
        {problems.map((problem, index) => {
          const isSelected = selectedProblems.includes(problem.label);
          return (
            <div
              key={problem.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md border cursor-move
                transition-all hover:shadow-md
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${isSelected ? 'bg-primary/10 border-primary' : 'bg-background'}
              `}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onSelect(problem.label)}
                className="h-auto p-0 text-xs hover:bg-transparent"
              >
                {problem.label}
              </Button>
              {isSelected && <Check className="w-3 h-3 text-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
