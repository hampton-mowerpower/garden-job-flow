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
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const yearStart = startOfYear(now).toISOString();

      // Get all jobs in one query - filter out deleted jobs
      const { data: jobs, error } = await supabase
        .from('jobs_db')
        .select('id, created_at, status, quotation_status')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get job parts to check for awaiting stock
      const { data: jobParts } = await supabase
        .from('job_parts')
        .select('job_id, awaiting_stock')
        .eq('awaiting_stock', true);

      const partsJobIds = new Set(jobParts?.map(p => p.job_id) || []);

      // Calculate stats
      const newStats: JobStats = {
        today: jobs?.filter(j => j.created_at >= todayStart).length || 0,
        thisWeek: jobs?.filter(j => j.created_at >= weekStart).length || 0,
        thisMonth: jobs?.filter(j => j.created_at >= monthStart).length || 0,
        thisYear: jobs?.filter(j => j.created_at >= yearStart).length || 0,
        open: jobs?.filter(j => j.status === 'pending' || j.status === 'in-progress').length || 0,
        waitingForParts: jobs?.filter(j => partsJobIds.has(j.id)).length || 0,
        waitingForQuote: jobs?.filter(j => j.quotation_status === 'pending').length || 0,
        completed: jobs?.filter(j => j.status === 'completed').length || 0,
        delivered: jobs?.filter(j => j.status === 'delivered').length || 0,
        writeOff: jobs?.filter(j => j.status === 'write_off').length || 0,
        loading: false,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading job stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return { stats, refresh: loadStats };
}
