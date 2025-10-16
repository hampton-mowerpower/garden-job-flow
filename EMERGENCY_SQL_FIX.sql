-- ⚠️ EMERGENCY: Run these commands IMMEDIATELY in Supabase SQL Editor
-- This fixes the PGRST002 "Could not query the database for the schema cache" error

-- STEP 1: Reload PostgREST schema and config cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- STEP 2: Grant necessary permissions to API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- STEP 3: Verify critical table permissions
SELECT 
  tablename,
  has_table_privilege('anon', 'public.' || tablename, 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', 'public.' || tablename, 'SELECT') as auth_can_select
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('jobs_db', 'customers_db', 'user_profiles', 'job_parts', 'brands', 'categories')
ORDER BY tablename;

-- STEP 4: Check for broken views (will show errors if any)
DO $$
DECLARE
  v record;
  v_error text;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
    BEGIN
      EXECUTE 'SELECT * FROM ' || v.viewname || ' LIMIT 1';
      RAISE NOTICE 'View % is OK', v.viewname;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      RAISE NOTICE 'View % is BROKEN: %', v.viewname, v_error;
    END;
  END LOOP;
END $$;

-- STEP 5: Create the reload function for future use
CREATE OR REPLACE FUNCTION public.reload_api_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only admins can reload schema
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Reload schema cache
  PERFORM pg_notify('pgrst', 'reload schema');
  
  -- Reload config cache
  PERFORM pg_notify('pgrst', 'reload config');
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'API schema and config reloaded successfully',
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.reload_api_schema IS 'Emergency function to reload PostgREST schema cache';

-- STEP 6: Test the API is responding
SELECT 'If you see this result, the database is working' as status;
