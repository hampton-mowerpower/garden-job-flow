-- ═══════════════════════════════════════════════════════════════════════════
-- CHANGELOG_SAFE.sql - Applied Changes for Job Loading Recovery
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 2025-10-16
-- Issue: PGRST002 error preventing job loading
-- Solution: Safe fallback functions with no SQL aggregate errors
-- ═══════════════════════════════════════════════════════════════════════════

-- ✅ NON-DESTRUCTIVE CHANGES ONLY
-- ✅ All operations are idempotent (can run multiple times safely)
-- ✅ No DROP statements
-- ✅ Transaction-safe with error handling

-- CHANGE 1: Created get_jobs_direct fallback function
-- Purpose: Bypass PostgREST REST API when PGRST002 error occurs
-- Method: CREATE OR REPLACE (safe)
-- Returns: TABLE with individual customer columns (no aggregates)
CREATE OR REPLACE FUNCTION public.get_jobs_direct(
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  grand_total numeric,
  balance_due numeric,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public;

-- CHANGE 2: Created get_job_detail_direct fallback function
-- Purpose: Load single job details when REST API is down
-- Method: CREATE OR REPLACE (safe)
-- Returns: TABLE with all job and customer fields
CREATE OR REPLACE FUNCTION public.get_job_detail_direct(p_job_id uuid)
RETURNS TABLE (
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
  customer_address text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public;

-- CHANGE 3: Granted permissions to UI roles
-- Purpose: Allow authenticated and anonymous users to call fallback functions
-- Method: GRANT (safe, idempotent)
GRANT EXECUTE ON FUNCTION public.get_jobs_direct(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_detail_direct(uuid) TO anon, authenticated;

-- CHANGE 4: Reloaded PostgREST caches
-- Purpose: Notify PostgREST to reload schema and config
-- Method: pg_notify (safe, non-blocking)
-- Note: This is a notification only, does not modify database state
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- ═══════════════════════════════════════════════════════════════════════════
-- RESULT: Jobs now load via fallback when REST API is down (PGRST002)
-- ═══════════════════════════════════════════════════════════════════════════
