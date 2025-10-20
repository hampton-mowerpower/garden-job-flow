-- Create efficient stats RPC that never 404s
CREATE OR REPLACE FUNCTION public.get_job_stats_efficient()
RETURNS TABLE (
  today int,
  this_week int,
  this_month int,
  this_year int,
  open int,
  parts int,
  quotes int,
  completed int,
  delivered int,
  write_off int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      created_at::date AS d,
      status
    FROM public.jobs_db
    WHERE deleted_at IS NULL
  )
  SELECT
    COUNT(*) FILTER (WHERE d = CURRENT_DATE)::int AS today,
    COUNT(*) FILTER (WHERE d >= DATE_TRUNC('week', CURRENT_DATE)::date)::int AS this_week,
    COUNT(*) FILTER (WHERE d >= DATE_TRUNC('month', CURRENT_DATE)::date)::int AS this_month,
    COUNT(*) FILTER (WHERE d >= DATE_TRUNC('year', CURRENT_DATE)::date)::int AS this_year,
    COUNT(*) FILTER (WHERE status IN ('in_progress','waiting_for_parts','waiting_for_quote'))::int AS open,
    COUNT(*) FILTER (WHERE status = 'waiting_for_parts')::int AS parts,
    COUNT(*) FILTER (WHERE status = 'waiting_for_quote')::int AS quotes,
    COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
    COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
    COUNT(*) FILTER (WHERE status = 'write_off')::int AS write_off
  FROM base;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_stats_efficient() TO anon, authenticated;