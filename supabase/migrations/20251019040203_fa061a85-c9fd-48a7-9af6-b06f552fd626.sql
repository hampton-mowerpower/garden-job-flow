-- Add get_job_stats_efficient function

CREATE OR REPLACE FUNCTION get_job_stats_efficient()
RETURNS json AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_revenue', COALESCE(SUM(grand_total) FILTER (WHERE status = 'completed'), 0)
  )
  INTO stats
  FROM jobs_db
  WHERE deleted_at IS NULL;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;