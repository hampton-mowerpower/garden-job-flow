-- ⚠️⚠️⚠️ EMERGENCY FIX V2: PostgREST Schema Cache Complete Recovery ⚠️⚠️⚠️
-- Run this ENTIRE script in Supabase SQL Editor (direct PostgreSQL connection)
-- This bypasses the broken PostgREST API and fixes it from the database side

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: IMMEDIATE SCHEMA RELOAD
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  EMERGENCY RECOVERY V2: Starting PostgREST Schema Fix     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '▶ Step 1: Reloading PostgREST schema and config...';
  
  -- Force PostgREST to reload
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  RAISE NOTICE '  ✓ Schema reload signals sent';
  
  -- Give PostgREST a moment to process
  PERFORM pg_sleep(2);
  
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: COMPREHENSIVE PERMISSION GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '▶ Step 2: Granting comprehensive permissions...';
  RAISE NOTICE '';
  
  -- Grant schema usage
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  RAISE NOTICE '  ✓ Schema USAGE granted';
  
  -- Grant table permissions
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  RAISE NOTICE '  ✓ Table permissions granted';
  
  -- Grant sequence permissions  
  GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
  RAISE NOTICE '  ✓ Sequence permissions granted';
  
  -- Grant function permissions
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
  RAISE NOTICE '  ✓ Function permissions granted';
  
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: SPECIFIC CRITICAL TABLE GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '▶ Step 3: Granting specific permissions on critical tables...';
  RAISE NOTICE '';
  
  -- Job-related tables
  GRANT SELECT, INSERT, UPDATE, DELETE ON jobs_db TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON customers_db TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON job_parts TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON job_payments TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON job_notes TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON job_sales_items TO authenticated;
  
  -- Category/Brand tables
  GRANT SELECT ON categories TO anon, authenticated;
  GRANT SELECT ON brands TO anon, authenticated;
  GRANT SELECT ON machinery_models TO anon, authenticated;
  
  -- User tables
  GRANT SELECT ON user_profiles TO authenticated;
  GRANT SELECT ON contacts TO authenticated;
  GRANT SELECT ON accounts TO authenticated;
  
  RAISE NOTICE '  ✓ Critical table permissions granted';
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: DETECT AND FIX BROKEN VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_view record;
  v_error text;
  v_broken_count int := 0;
BEGIN
  RAISE NOTICE '▶ Step 4: Checking all views for compilation errors...';
  RAISE NOTICE '';
  
  FOR v_view IN 
    SELECT schemaname, viewname 
    FROM pg_views 
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    BEGIN
      -- Try to query the view
      EXECUTE format('SELECT * FROM %I.%I LIMIT 1', v_view.schemaname, v_view.viewname);
      -- RAISE NOTICE '  ✓ View %s is OK', v_view.viewname;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      v_broken_count := v_broken_count + 1;
      RAISE WARNING '  ✗ BROKEN VIEW: % - Error: %', v_view.viewname, v_error;
      
      -- Log to maintenance_audit if table exists
      BEGIN
        INSERT INTO maintenance_audit (
          action,
          table_name,
          description,
          rows_affected,
          performed_at
        ) VALUES (
          'view_error',
          v_view.viewname,
          v_error,
          0,
          now()
        );
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if audit table doesn't exist
      END;
    END;
  END LOOP;
  
  IF v_broken_count = 0 THEN
    RAISE NOTICE '  ✓ All views compile successfully';
  ELSE
    RAISE WARNING '  ⚠ Found % broken views - see details above', v_broken_count;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5: CREATE HEALTH CHECK FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '▶ Step 5: Creating/updating health check functions...';
  RAISE NOTICE '';
END $$;

-- Simple health check that works even without admin
CREATE OR REPLACE FUNCTION public.api_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_count int;
  v_customer_count int;
BEGIN
  -- Try to query critical tables
  SELECT COUNT(*) INTO v_job_count 
  FROM jobs_db 
  WHERE deleted_at IS NULL 
  LIMIT 100;
  
  SELECT COUNT(*) INTO v_customer_count 
  FROM customers_db 
  WHERE is_deleted = false 
  LIMIT 100;
  
  RETURN jsonb_build_object(
    'success', true,
    'healthy', true,
    'jobs_accessible', true,
    'customers_accessible', true,
    'job_count', LEAST(v_job_count, 100),
    'customer_count', LEAST(v_customer_count, 100),
    'timestamp', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'healthy', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'timestamp', now()
  );
END;
$$;

COMMENT ON FUNCTION public.api_health_check IS 'Health check function for API status - no admin required';

-- Reload function
CREATE OR REPLACE FUNCTION public.reload_api_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Send reload notifications
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  -- Wait for PostgREST to process
  PERFORM pg_sleep(2);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'PostgREST schema and config reloaded',
    'timestamp', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'timestamp', now()
  );
END;
$$;

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION public.api_health_check() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reload_api_schema() TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Health check functions created';
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 6: VERIFY PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '▶ Step 6: Verifying permissions on critical tables...';
  RAISE NOTICE '';
END $$;

SELECT 
  '  ' || tablename as "Table",
  CASE WHEN has_table_privilege('anon', 'public.' || tablename, 'SELECT') 
       THEN '✓' ELSE '✗' END as "anon SELECT",
  CASE WHEN has_table_privilege('authenticated', 'public.' || tablename, 'SELECT') 
       THEN '✓' ELSE '✗' END as "auth SELECT",
  CASE WHEN has_table_privilege('authenticated', 'public.' || tablename, 'INSERT') 
       THEN '✓' ELSE '✗' END as "auth INSERT",
  CASE WHEN has_table_privilege('authenticated', 'public.' || tablename, 'UPDATE') 
       THEN '✓' ELSE '✗' END as "auth UPDATE"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('jobs_db', 'customers_db', 'job_parts', 'job_payments', 'user_profiles')
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 7: FINAL RELOAD AND VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '▶ Step 7: Final schema reload...';
  
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  -- Wait for PostgREST
  PERFORM pg_sleep(3);
  
  RAISE NOTICE '  ✓ Final reload complete';
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  RECOVERY COMPLETE - Now test the health check:           ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  SELECT * FROM api_health_check();                        ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║  Expected result: {"success": true, "healthy": true}      ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- Run the health check to verify
SELECT 
  '✓ API Health Check Result:' as status,
  api_health_check() as result;
