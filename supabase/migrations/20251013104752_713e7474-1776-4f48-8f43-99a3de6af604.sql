-- Fix RPC functions to include customer data via JOIN
-- This maintains performance while showing customer names

-- Drop and recreate list_jobs_page with customer data
DROP FUNCTION IF EXISTS public.list_jobs_page(integer, timestamp with time zone, text);

CREATE FUNCTION public.list_jobs_page(
  p_limit integer DEFAULT 25,
  p_before timestamp with time zone DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamp with time zone,
  grand_total numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  balance_due numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.grand_total,
    j.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    j.balance_due
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE 
    j.deleted_at IS NULL
    AND (p_before IS NULL OR j.created_at < p_before)
    AND (p_status IS NULL OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit;
$$;

-- Update search_job_by_number to include customer data
DROP FUNCTION IF EXISTS public.search_job_by_number(text);

CREATE FUNCTION public.search_job_by_number(
  p_job_number text
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamp with time zone,
  grand_total numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  balance_due numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    j.id, j.job_number, j.status, j.created_at, 
    j.grand_total, j.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    j.machine_category, j.machine_brand, j.machine_model, j.machine_serial,
    j.problem_description, j.balance_due
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE j.job_number = p_job_number
    AND j.deleted_at IS NULL;
$$;

-- Update search_jobs_by_customer_name to match new structure
DROP FUNCTION IF EXISTS public.search_jobs_by_customer_name(text, integer);

CREATE FUNCTION public.search_jobs_by_customer_name(
  p_name text,
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamp with time zone,
  grand_total numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  balance_due numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    j.id, j.job_number, j.status, j.created_at, 
    j.grand_total, j.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    j.machine_category, j.machine_brand, j.machine_model, j.machine_serial,
    j.problem_description, j.balance_due
  FROM public.jobs_db j
  INNER JOIN public.customers_db c ON c.id = j.customer_id
  WHERE lower(c.name) LIKE lower(p_name) || '%'
    AND j.deleted_at IS NULL
    AND c.is_deleted = false
  ORDER BY j.created_at DESC
  LIMIT p_limit;
$$;