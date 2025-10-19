-- Final comprehensive migration to match all code expectations

-- Add missing columns to parts_catalogue
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS upc TEXT;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS competitor_price NUMERIC DEFAULT 0;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS source TEXT;

-- Add missing columns to machinery_models
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS requires_engine_serial BOOLEAN DEFAULT false;

-- Add completed_at to jobs_db for reports
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create reporting RPC functions
CREATE OR REPLACE FUNCTION get_daily_takings(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  date DATE,
  total_revenue NUMERIC,
  job_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(j.created_at) as date,
    SUM(j.grand_total) as total_revenue,
    COUNT(*)::INT as job_count
  FROM jobs_db j
  WHERE DATE(j.created_at) BETWEEN p_start_date AND p_end_date
    AND j.deleted_at IS NULL
  GROUP BY DATE(j.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_technician_productivity(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  technician TEXT,
  jobs_completed INT,
  total_revenue NUMERIC,
  avg_job_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(j.status, 'Unknown') as technician,
    COUNT(*)::INT as jobs_completed,
    SUM(j.grand_total) as total_revenue,
    AVG(j.grand_total) as avg_job_value
  FROM jobs_db j
  WHERE DATE(j.created_at) BETWEEN p_start_date AND p_end_date
    AND j.deleted_at IS NULL
  GROUP BY j.status
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_parts_usage_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  part_id UUID,
  part_name TEXT,
  quantity_used NUMERIC,
  total_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.part_id,
    COALESCE(pc.name, jp.description) as part_name,
    SUM(jp.quantity) as quantity_used,
    SUM(jp.total_price) as total_value
  FROM job_parts jp
  LEFT JOIN parts_catalogue pc ON jp.part_id = pc.id
  LEFT JOIN jobs_db j ON jp.job_id = j.id
  WHERE DATE(j.created_at) BETWEEN p_start_date AND p_end_date
    AND j.deleted_at IS NULL
  GROUP BY jp.part_id, pc.name, jp.description
  ORDER BY total_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;