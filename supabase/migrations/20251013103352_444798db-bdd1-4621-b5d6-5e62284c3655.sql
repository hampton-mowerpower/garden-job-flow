-- ============================================
-- PHASE 1: Core Performance Indexes
-- ============================================

-- Most common query: list jobs by creation date
CREATE INDEX IF NOT EXISTS idx_jobs_created_desc 
  ON public.jobs_db (created_at DESC);

-- Filter by status + sort by date (composite index)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
  ON public.jobs_db (status, created_at DESC);

-- Customer relationship queries
CREATE INDEX IF NOT EXISTS idx_jobs_customer_created 
  ON public.jobs_db (customer_id, created_at DESC);

-- Exact job number lookup (search)
CREATE INDEX IF NOT EXISTS idx_jobs_jobnumber 
  ON public.jobs_db (job_number);

-- Customer phone lookup (search)
CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON public.customers_db (phone);

-- Customer phone E164 lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone_e164
  ON public.customers_db (phone_e164);

-- ============================================
-- PHASE 2: Text Search Optimization
-- ============================================

-- Add lowercase name column for case-insensitive prefix search
ALTER TABLE public.customers_db
  ADD COLUMN IF NOT EXISTS name_lower text
  GENERATED ALWAYS AS (lower(name)) STORED;

CREATE INDEX IF NOT EXISTS idx_customers_name_lower 
  ON public.customers_db (name_lower text_pattern_ops);

-- Enable trigram extension for fuzzy/ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for partial text matching
CREATE INDEX IF NOT EXISTS idx_jobs_problem_trgm 
  ON public.jobs_db USING GIN (problem_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_name_trgm 
  ON public.customers_db USING GIN (name gin_trgm_ops);

-- ============================================
-- PHASE 3: Fast Paginated Job List RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.list_jobs_page(
  p_limit int DEFAULT 25,
  p_before timestamptz DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  customer_id uuid,
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
SET search_path = public
AS $$
  SELECT 
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.grand_total,
    j.customer_id,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    j.balance_due
  FROM public.jobs_db j
  WHERE 
    j.deleted_at IS NULL
    AND (p_before IS NULL OR j.created_at < p_before)
    AND (p_status IS NULL OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit;
$$;

-- ============================================
-- PHASE 4: Fast Search Functions
-- ============================================

-- Search by job number (exact match)
CREATE OR REPLACE FUNCTION public.search_job_by_number(
  p_job_number text
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  customer_id uuid,
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
SET search_path = public
AS $$
  SELECT 
    j.id, j.job_number, j.status, j.created_at, 
    j.grand_total, j.customer_id, j.machine_category, 
    j.machine_brand, j.machine_model, j.machine_serial,
    j.problem_description, j.balance_due
  FROM public.jobs_db j
  WHERE j.job_number = p_job_number
    AND j.deleted_at IS NULL;
$$;

-- Search jobs by customer phone (supports both formats)
CREATE OR REPLACE FUNCTION public.search_jobs_by_phone(
  p_phone text,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  machine_category text,
  machine_brand text,
  machine_model text,
  problem_description text,
  balance_due numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id, j.job_number, j.status, j.created_at, 
    j.grand_total, j.customer_id,
    c.name, c.phone,
    j.machine_category, j.machine_brand, j.machine_model,
    j.problem_description, j.balance_due
  FROM public.jobs_db j
  INNER JOIN public.customers_db c ON c.id = j.customer_id
  WHERE (c.phone = p_phone OR c.phone_e164 = p_phone)
    AND j.deleted_at IS NULL
    AND c.is_deleted = false
  ORDER BY j.created_at DESC
  LIMIT p_limit;
$$;

-- Search jobs by customer name (prefix match)
CREATE OR REPLACE FUNCTION public.search_jobs_by_customer_name(
  p_name text,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  machine_category text,
  machine_brand text,
  machine_model text,
  problem_description text,
  balance_due numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id, j.job_number, j.status, j.created_at, 
    j.grand_total, j.customer_id,
    c.name, c.phone,
    j.machine_category, j.machine_brand, j.machine_model,
    j.problem_description, j.balance_due
  FROM public.jobs_db j
  INNER JOIN public.customers_db c ON c.id = j.customer_id
  WHERE lower(c.name) LIKE lower(p_name) || '%'
    AND j.deleted_at IS NULL
    AND c.is_deleted = false
  ORDER BY j.created_at DESC
  LIMIT p_limit;
$$;

-- Batch load customer info (prevent N+1)
CREATE OR REPLACE FUNCTION public.get_customers_by_ids(
  p_customer_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  address text,
  suburb text,
  postcode text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.suburb,
    c.postcode
  FROM public.customers_db c
  WHERE c.id = ANY(p_customer_ids)
    AND c.is_deleted = false;
$$;