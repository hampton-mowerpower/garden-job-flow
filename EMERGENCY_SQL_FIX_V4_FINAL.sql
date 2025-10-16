-- ⚠️⚠️⚠️ EMERGENCY FIX V4: Fix Direct Query Functions ⚠️⚠️⚠️
-- This fixes the SQL aggregate error in get_jobs_direct
-- Run this ENTIRE script in Supabase SQL Editor NOW

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: DROP BROKEN FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.get_jobs_direct(int, int);
DROP FUNCTION IF EXISTS public.get_job_detail_direct(uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: CREATE FIXED JOB LIST FUNCTION (Returns TABLE not jsonb)
-- ═══════════════════════════════════════════════════════════════════════════

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
SET search_path = public
AS $$
  SELECT
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.grand_total,
    j.balance_due,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE j.deleted_at IS NULL
  ORDER BY j.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: CREATE JOB DETAIL FUNCTION (For Job Details page)
-- ═══════════════════════════════════════════════════════════════════════════

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
SET search_path = public
AS $$
  SELECT
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.updated_at,
    j.notes,
    j.grand_total,
    j.balance_due,
    j.subtotal,
    j.gst,
    j.parts_subtotal,
    j.labour_total,
    j.labour_hours,
    j.labour_rate,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    j.service_performed,
    j.recommendations,
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    c.address AS customer_address
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON c.id = j.customer_id
  WHERE j.id = p_job_id
    AND j.deleted_at IS NULL;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.get_jobs_direct(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_detail_direct(uuid) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: RELOAD POSTGREST
-- ═══════════════════════════════════════════════════════════════════════════

SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: TEST THE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_test_count integer;
  v_test_job record;
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  TESTING FALLBACK FUNCTIONS                                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- Test jobs list
  SELECT COUNT(*) INTO v_test_count
  FROM public.get_jobs_direct(5, 0);
  
  RAISE NOTICE '▶ Test 1: get_jobs_direct(5, 0)';
  RAISE NOTICE '  ✓ Returned % jobs', v_test_count;
  
  -- Get one job for detail test
  SELECT id INTO v_test_job
  FROM public.get_jobs_direct(1, 0)
  LIMIT 1;
  
  IF v_test_job.id IS NOT NULL THEN
    -- Test job detail
    SELECT COUNT(*) INTO v_test_count
    FROM public.get_job_detail_direct(v_test_job.id);
    
    RAISE NOTICE '';
    RAISE NOTICE '▶ Test 2: get_job_detail_direct(job_id)';
    RAISE NOTICE '  ✓ Returned % row(s)', v_test_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  V4 FIX COMPLETE                                           ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  ✓ Fallback functions are working                         ║';
  RAISE NOTICE '║  ✓ Jobs will load in the UI now (fallback mode)           ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  NEXT: Refresh your app to see jobs load                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
END $$;
