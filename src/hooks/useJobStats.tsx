import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export interface JobStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  open: number;
  waitingForParts: number;
  waitingForQuote: number;
  completed: number;
  delivered: number;
  writeOff: number;
  loading: boolean;
}

export function useJobStats() {
  const [stats, setStats] = useState<JobStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    open: 0,
    waitingForParts: 0,
    waitingForQuote: 0,
    completed: 0,
    delivered: 0,
    writeOff: 0,
    loading: true,
  });

  useEffect(() => {
    const abortController = new AbortController();
    loadStats(abortController.signal);
    
    // Cleanup: abort any pending queries on unmount
    return () => {
      abortController.abort();
    };
  }, []);

  const loadStats = async (signal?: AbortSignal) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const yearStart = startOfYear(now).toISOString();

      // Batch queries into 3 groups to reduce concurrent connections (10 -> 3-4 max)
      // Group 1: Date-based counts
      const [todayCount, weekCount, monthCount, yearCount] = await Promise.all([
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).gte('created_at', todayStart).is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).gte('created_at', weekStart).is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).gte('created_at', monthStart).is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).gte('created_at', yearStart).is('deleted_at', null).abortSignal(signal),
      ]);

      // Group 2: Status counts
      const [openCount, completedCount, deliveredCount, writeOffCount] = await Promise.all([
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in-progress']).is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).eq('status', 'completed').is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).eq('status', 'delivered').is('deleted_at', null).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).eq('status', 'write_off').is('deleted_at', null).abortSignal(signal),
      ]);

      // Group 3: Special conditions (parts & quotes)
      const [partsCount, quoteCount] = await Promise.all([
        supabase.from('job_parts').select('job_id', { count: 'exact', head: true }).eq('awaiting_stock', true).abortSignal(signal),
        supabase.from('jobs_db').select('id', { count: 'exact', head: true }).eq('quotation_status', 'pending').is('deleted_at', null).abortSignal(signal),
      ]);

      // Build stats from counts
      const newStats: JobStats = {
        today: todayCount.count || 0,
        thisWeek: weekCount.count || 0,
        thisMonth: monthCount.count || 0,
        thisYear: yearCount.count || 0,
        open: openCount.count || 0,
        waitingForParts: partsCount.count || 0,
        waitingForQuote: quoteCount.count || 0,
        completed: completedCount.count || 0,
        delivered: deliveredCount.count || 0,
        writeOff: writeOffCount.count || 0,
        loading: false,
      };

      setStats(newStats);
    } catch (error: any) {
      // Don't log aborted queries as errors
      if (error?.name === 'AbortError' || signal?.aborted) {
        return;
      }
      console.error('Error loading job stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const refresh = () => {
    const abortController = new AbortController();
    loadStats(abortController.signal);
  };

  return { stats, refresh };
}
