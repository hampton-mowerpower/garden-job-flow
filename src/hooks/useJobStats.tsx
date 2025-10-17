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
  // DISABLED: Connection pool exhaustion fix
  // Return dummy data to prevent automatic queries on page load
  // Stats will be loaded via RPC function when explicitly requested
  
  const [stats] = useState<JobStats>({
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
    loading: false, // Not loading, just returning empty data
  });

  const refresh = () => {
    // DISABLED: Will be replaced with RPC call
    console.log('Stats refresh disabled - use RPC function instead');
  };

  return { stats, refresh };
}
