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
      // Use efficient RPC that counts directly in database
      // Note: Type will be available after Supabase regenerates types
      const { data, error } = await (supabase.rpc as any)('get_job_stats_efficient');

      if (error) {
        console.error('Error loading job stats:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from stats query');
      }

      const newStats: JobStats = {
        today: data.today || 0,
        thisWeek: data.thisWeek || 0,
        thisMonth: data.thisMonth || 0,
        thisYear: data.thisYear || 0,
        open: data.open || 0,
        waitingForParts: data.waitingForParts || 0,
        waitingForQuote: data.waitingForQuote || 0,
        completed: data.completed || 0,
        delivered: data.delivered || 0,
        writeOff: data.writeOff || 0,
        loading: false,
      };

      setStats(newStats);
    } catch (error: any) {
      console.error('Error loading job stats:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return { stats, refresh: loadStats };
}
