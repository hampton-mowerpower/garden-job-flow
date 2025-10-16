# EMERGENCY: Schema Cache Fix Instructions

## Problem
PostgREST API returning 503 errors with "PGRST002: Could not query the database for the schema cache"

## Root Cause
Recent database migrations caused PostgREST schema cache to become stale or corrupted. The API layer cannot read its internal schema metadata.

## Immediate Fix (Run in Supabase SQL Editor)

### Step 1: Reload Schema Cache
```sql
-- Reload PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Reload PostgREST config cache  
SELECT pg_notify('pgrst', 'reload config');
```

### Step 2: Verify Grants
```sql
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Specific critical tables
GRANT SELECT ON public.jobs_db TO anon, authenticated;
GRANT SELECT ON public.customers_db TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT SELECT ON public.job_parts TO anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
```

### Step 3: Create Reload Function
```sql
-- Emergency schema reload function
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
```

### Step 4: Check for Broken Objects
```sql
-- Find invalid functions
SELECT 
  p.proname as function_name,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 0 
  AND n.nspname = 'public';

-- Find views with errors
SELECT 
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

## Testing After Fix

1. **Health Check**
   - Refresh the app
   - Go to Admin Settings → Data Review → Forensics tab
   - Click "Check Health" button
   - Should show "Healthy" status

2. **Job Search Test**
   - Navigate to Search & Manage Jobs
   - Should see job statistics cards populated (not all zeros)
   - Should see jobs list (not "No jobs created yet")
   - Try searching for a job number

3. **API Test**
   ```sql
   -- Run this query - should return rows without error
   SELECT id, job_number, status 
   FROM jobs_db 
   WHERE deleted_at IS NULL 
   LIMIT 5;
   ```

## Prevention

The app now includes:
- **Admin Control**: "Reload API Schema" button in Admin → Data Review → Forensics
- **Better Error Messages**: Clear indication of schema cache errors
- **Health Monitoring**: One-click health check

## What Likely Broke It

Recent changes that could cause this:
1. Database functions created without proper `SET search_path`
2. Views created without fully qualified table names
3. Triggers referencing ambiguous column names
4. RLS policies with recursive queries
5. Missing grants after new tables/columns added

## If Still Broken

1. Check Supabase dashboard logs for more details
2. Restart Supabase database (Dashboard → Settings → Database → Restart)
3. Check for failed migrations in Dashboard → Database → Migrations
4. Review recent schema changes and roll back if needed
