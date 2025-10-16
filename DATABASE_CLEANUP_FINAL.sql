-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE_CLEANUP_FINAL.sql
-- Purpose: Remove all emergency functions and restore clean PostgREST state
-- Safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Remove All Emergency Functions
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.get_jobs_direct(int, int) CASCADE;
DROP FUNCTION IF EXISTS public.get_job_detail_direct(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reload_api_schema() CASCADE;
DROP FUNCTION IF EXISTS public.api_health_check() CASCADE;

RAISE NOTICE '✓ Removed emergency functions';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Grant Basic Permissions (Idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.jobs_db TO anon, authenticated;
GRANT SELECT ON public.customers_db TO anon, authenticated;
GRANT SELECT ON public.job_parts TO anon, authenticated;
GRANT SELECT ON public.job_payments TO anon, authenticated;
GRANT SELECT ON public.job_notes TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;

-- For authenticated users who need to modify data
GRANT INSERT, UPDATE, DELETE ON public.jobs_db TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.customers_db TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_parts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_notes TO authenticated;

RAISE NOTICE '✓ Granted permissions';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Reload PostgREST Schema Cache
-- ═══════════════════════════════════════════════════════════════════════════

SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

RAISE NOTICE '✓ PostgREST reload signals sent';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Verify Permissions
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_jobs_readable boolean;
  v_customers_readable boolean;
BEGIN
  SELECT has_table_privilege('anon', 'public.jobs_db', 'SELECT') INTO v_jobs_readable;
  SELECT has_table_privilege('anon', 'public.customers_db', 'SELECT') INTO v_customers_readable;
  
  IF v_jobs_readable AND v_customers_readable THEN
    RAISE NOTICE '✓ Permissions verified: anon can read jobs_db and customers_db';
  ELSE
    RAISE WARNING '⚠ Permission issue: jobs_readable=%, customers_readable=%', v_jobs_readable, v_customers_readable;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Test Basic Queries
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_job_count integer;
  v_customer_count integer;
BEGIN
  SELECT COUNT(*) INTO v_job_count FROM public.jobs_db WHERE deleted_at IS NULL LIMIT 100;
  SELECT COUNT(*) INTO v_customer_count FROM public.customers_db WHERE is_deleted = false LIMIT 100;
  
  RAISE NOTICE '✓ Found % active jobs and % active customers', v_job_count, v_customer_count;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  '✅ DATABASE_CLEANUP_FINAL completed successfully' as status,
  'Wait 30 seconds, then test the API' as next_step;
