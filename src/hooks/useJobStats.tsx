import { useState, useEffect } from 'react';
import { getJobStatsEfficient } from '@/lib/api';

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
      const data = await getJobStatsEfficient();

      if (!data) {
        throw new Error('No data returned from stats query');
      }

      const newStats: JobStats = {
        today: data.today || 0,
        thisWeek: data.this_week || 0,
        thisMonth: data.this_month || 0,
        thisYear: data.this_year || 0,
        open: data.open || 0,
        waitingForParts: data.parts || 0,
        waitingForQuote: data.quotes || 0,
        completed: data.completed || 0,
        delivered: data.delivered || 0,
        writeOff: data.write_off || 0,
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
