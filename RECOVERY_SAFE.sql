-- ═══════════════════════════════════════════════════════════════════════════
-- RECOVERY_SAFE.sql - Non-Destructive Fix for Job Loading
-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ NO DROP STATEMENTS - Fully idempotent and transaction-safe
-- ✅ Use CREATE OR REPLACE only
-- ✅ Wrapped in error-handling transaction
-- ═══════════════════════════════════════════════════════════════════════════

DO $block$
BEGIN
  RAISE NOTICE '🔧 Starting RECOVERY_SAFE...';
  RAISE NOTICE '';
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PART 1: Create Safe Fallback Functions (No Aggregates, No Destructive Ops)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '▶ Creating fallback function: get_jobs_direct';
  
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
  
  RAISE NOTICE '  ✓ get_jobs_direct created';
  RAISE NOTICE '';
  RAISE NOTICE '▶ Creating fallback function: get_job_detail_direct';
  
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
  
  RAISE NOTICE '  ✓ get_job_detail_direct created';
  RAISE NOTICE '';
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PART 2: Grant Permissions to UI Roles
  -- ═══════════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '▶ Granting permissions to anon and authenticated roles';
  
  GRANT EXECUTE ON FUNCTION public.get_jobs_direct(int, int) TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.get_job_detail_direct(uuid) TO anon, authenticated;
  
  RAISE NOTICE '  ✓ Permissions granted';
  RAISE NOTICE '';
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PART 3: Reload PostgREST Schema Cache
  -- ═══════════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '▶ Reloading PostgREST schema cache';
  
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  RAISE NOTICE '  ✓ PostgREST notified to reload';
  RAISE NOTICE '';
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PART 4: Test Functions
  -- ═══════════════════════════════════════════════════════════════════════════
  
  RAISE NOTICE '▶ Testing fallback functions';
  
  DECLARE
    v_test_count integer;
    v_test_job record;
  BEGIN
    -- Test jobs list
    SELECT COUNT(*) INTO v_test_count
    FROM public.get_jobs_direct(5, 0);
    
    RAISE NOTICE '  ✓ get_jobs_direct(5, 0) returned % jobs', v_test_count;
    
    -- Get one job for detail test
    SELECT id INTO v_test_job
    FROM public.get_jobs_direct(1, 0)
    LIMIT 1;
    
    IF v_test_job.id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_test_count
      FROM public.get_job_detail_direct(v_test_job.id);
      
      RAISE NOTICE '  ✓ get_job_detail_direct(job_id) returned % row(s)', v_test_count;
    END IF;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ RECOVERY_SAFE COMPLETED SUCCESSFULLY                   ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  ✓ Fallback functions created (no SQL aggregate errors)   ║';
  RAISE NOTICE '║  ✓ Permissions granted to UI roles                        ║';
  RAISE NOTICE '║  ✓ PostgREST caches reloaded                              ║';
  RAISE NOTICE '║  ✓ Functions tested and working                           ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  NEXT: Refresh your app - jobs will load in fallback mode ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ❌ RECOVERY_SAFE FAILED                                   ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  Error: %', SQLERRM;
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  The transaction will be rolled back (no partial state)   ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE;
END
$block$;
