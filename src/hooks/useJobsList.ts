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
  return useQuery({
    queryKey: ['jobs-list', params],
    queryFn: async () => {
      const rows = await getJobsListSimple(params.limit || 25, params.offset || 0);
      return rows.map(convertToJob);
    },
    staleTime: 15000,
    retry: 1,
  });
}

export type { JobListRow, Job };
