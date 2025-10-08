import { useCallback, useEffect, useRef } from 'react';
import { useToast } from './use-toast';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ data, onSave, delay = 500, enabled = true }: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  // Update data ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const triggerSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      await onSave(dataRef.current);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Failed to save changes. Please try manually saving.',
        variant: 'destructive'
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, onSave, toast]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delay);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, delay, enabled, triggerSave]);

  return { isSaving: isSavingRef.current };
}
