import { useQuery } from '@tanstack/react-query';
import { getJobsListSimple } from '@/lib/api';
import { convertToJob } from '@/lib/mappers/jobMapper';
import type { JobListRow } from '@/lib/types';
import type { Job } from '@/types/job';

interface UseJobsListParams {
  limit?: number;
  offset?: number;
}

export function useJobsList(params: UseJobsListParams = {}) {
  return useQuery<(Job & { latestNoteAt?: string })[]>({
    queryKey: ['jobs-list', params],
    queryFn: async () => {
      const rows = await getJobsListSimple(params);
      return rows.map(convertToJob);
    },
    staleTime: 60000, // Don't refetch for 1 minute
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 1,
  });
}

export type { JobListRow, Job };
