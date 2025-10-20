import { useQuery } from '@tanstack/react-query';
import { getJobsListSimple } from '@/lib/api';
import type { JobListRow } from '@/lib/types';

interface UseJobsListParams {
  limit?: number;
  offset?: number;
}

export function useJobsList(params: UseJobsListParams = {}) {
  return useQuery({
    queryKey: ['jobs-list', params],
    queryFn: () => getJobsListSimple(params.limit || 25, params.offset || 0),
    staleTime: 15000,
    retry: 1,
  });
}

export type { JobListRow };
