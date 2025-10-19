import { supabase } from './supabase';
import { withTimeout } from './withTimeout';

export async function getJobsListSimple(limit = 50, offset = 0) {
  const result = await withTimeout(
    (async () => {
      return await supabase.rpc('get_jobs_list_simple', { p_limit: limit, p_offset: offset });
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return data ?? [];
}

export async function getJobDetailSimple(id: string) {
  const result = await withTimeout(
    (async () => {
      return await supabase.rpc('get_job_detail_simple', { p_job_id: id });
    })(),
    10000
  );
  const { data, error } = result;
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function apiHealth() {
  const { data, error } = await supabase.rpc('api_health_check');
  if (error) throw error;
  return data;
}
