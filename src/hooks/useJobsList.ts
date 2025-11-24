import { useQuery } from '@tanstack/react-query';
import { getJobsListSimple } from '@/lib/api';
import { convertToJob } from '@/lib/mappers/jobMapper';
import type { JobListRow } from '@/lib/types';
import type { Job } from '@/types/job';

interface UseJobsListParams {
  limit?: number;
  offset?: number;
  search?: string | null;
  status?: string | null;
}

export function useJobsList(params: UseJobsListParams = {}) {
  return useQuery<(Job & { latestNoteAt?: string })[]>({
    queryKey: ['jobs', 'list', params], // Better namespaced key
    queryFn: async () => {
      const rows = await getJobsListSimple(params);
      return rows.map(convertToJob);
    },
    staleTime: 60_000, // 1 minute - prevent request storms
    gcTime: 300_000, // 5 minutes - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export type { JobListRow, Job };
