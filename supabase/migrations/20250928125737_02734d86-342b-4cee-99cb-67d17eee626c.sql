-- Fix security warnings by setting proper search_path for reporting functions

CREATE OR REPLACE FUNCTION get_daily_takings(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  total_jobs BIGINT,
  total_revenue DECIMAL,
  average_job_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.created_at::DATE as date,
    COUNT(j.id) as total_jobs,
    COALESCE(SUM(j.grand_total), 0) as total_revenue,
    COALESCE(AVG(j.grand_total), 0) as average_job_value
  FROM jobs_db j
  WHERE j.created_at::DATE BETWEEN start_date AND end_date
    AND j.status = 'completed'
  GROUP BY j.created_at::DATE
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_technician_productivity(start_date DATE, end_date DATE, filter_technician_id UUID DEFAULT NULL)
RETURNS TABLE (
  technician_id UUID,
  technician_name TEXT,
  jobs_completed BIGINT,
  total_revenue DECIMAL,
  average_job_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as technician_id,
    up.full_name as technician_name,
    COUNT(j.id) as jobs_completed,
    COALESCE(SUM(j.grand_total), 0) as total_revenue,
    COALESCE(AVG(EXTRACT(epoch FROM (j.completed_at - j.created_at))/3600), 0) as average_job_time
  FROM user_profiles up
  LEFT JOIN jobs_db j ON j.assigned_technician = up.id
  WHERE up.role = 'technician'
    AND (filter_technician_id IS NULL OR up.id = filter_technician_id)
    AND (j.created_at IS NULL OR j.created_at::DATE BETWEEN start_date AND end_date)
    AND (j.status IS NULL OR j.status = 'completed')
  GROUP BY up.id, up.full_name
  ORDER BY jobs_completed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_parts_usage_report(start_date DATE, end_date DATE)
RETURNS TABLE (
  part_id UUID,
  part_name TEXT,
  sku TEXT,
  total_quantity BIGINT,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as part_id,
    p.name as part_name,
    p.sku,
    COALESCE(SUM(jp.quantity), 0) as total_quantity,
    COALESCE(SUM(jp.total_price), 0) as total_value
  FROM parts_catalogue p
  LEFT JOIN job_parts jp ON jp.part_id = p.id
  LEFT JOIN jobs_db j ON j.id = jp.job_id
  WHERE j.created_at IS NULL OR j.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY p.id, p.name, p.sku
  HAVING COALESCE(SUM(jp.quantity), 0) > 0
  ORDER BY total_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;