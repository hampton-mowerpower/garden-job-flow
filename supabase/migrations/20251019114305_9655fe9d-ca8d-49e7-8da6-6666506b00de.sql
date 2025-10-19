-- Drop and recreate get_jobs_list_simple RPC
DROP FUNCTION IF EXISTS public.get_jobs_list_simple(integer, integer);

CREATE FUNCTION public.get_jobs_list_simple(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  balance_due numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text
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
    j.grand_total,
    j.balance_due,
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE j.deleted_at IS NULL
  ORDER BY j.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_jobs_list_simple(integer, integer) TO anon, authenticated;