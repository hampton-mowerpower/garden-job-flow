-- Drop existing view and function if they exist
DROP VIEW IF EXISTS v_jobs_list;
DROP FUNCTION IF EXISTS get_job_detail_simple(uuid);

-- Create view for job list with customer data
CREATE VIEW v_jobs_list AS
SELECT 
  j.id,
  j.job_number,
  j.status,
  j.created_at,
  j.grand_total,
  j.balance_due,
  j.customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  c.email as customer_email,
  j.machine_category,
  j.machine_brand,
  j.machine_model,
  j.machine_serial,
  j.problem_description
FROM jobs_db j
LEFT JOIN customers_db c ON c.id = j.customer_id
WHERE j.deleted_at IS NULL
ORDER BY j.created_at DESC;

-- Create simple RPC for job details
CREATE FUNCTION get_job_detail_simple(p_job_id uuid)
RETURNS TABLE(
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  notes text,
  grand_total numeric,
  balance_due numeric,
  labour_hours numeric,
  labour_rate numeric,
  labour_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.updated_at,
    j.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    j.notes,
    j.grand_total,
    j.balance_due,
    j.labour_hours,
    j.labour_rate,
    j.labour_total
  FROM jobs_db j
  LEFT JOIN customers_db c ON c.id = j.customer_id
  WHERE j.id = p_job_id
    AND j.deleted_at IS NULL;
$$;

-- Grant access to view
GRANT SELECT ON v_jobs_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_detail_simple(uuid) TO authenticated;