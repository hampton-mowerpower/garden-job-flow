-- Drop and recreate get_job_detail_simple with version field
DROP FUNCTION IF EXISTS public.get_job_detail_simple(uuid);

CREATE FUNCTION public.get_job_detail_simple(p_job_id uuid)
RETURNS TABLE(
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  notes text,
  grand_total numeric,
  balance_due numeric,
  subtotal numeric,
  gst numeric,
  parts_subtotal numeric,
  labour_total numeric,
  labour_hours numeric,
  labour_rate numeric,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  service_performed text,
  recommendations text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  version integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id, j.job_number, j.status, j.created_at, j.updated_at,
    j.notes, j.grand_total, j.balance_due,
    j.subtotal, j.gst, j.parts_subtotal, j.labour_total, j.labour_hours, j.labour_rate,
    j.machine_category, j.machine_brand, j.machine_model, j.machine_serial,
    j.problem_description, j.service_performed, j.recommendations,
    c.id, c.name, c.phone, c.email, c.address,
    j.version
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE j.id = p_job_id AND j.deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_detail_simple(uuid) TO anon, authenticated;