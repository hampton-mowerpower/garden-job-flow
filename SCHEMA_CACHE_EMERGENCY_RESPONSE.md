# Schema Cache Emergency Response - COMPLETE

## Status: ✅ UI Fixed, Manual Database Steps Required

### What I've Done

#### A) Immediate Rollback Guard ✅
- Added schema error detection in Job Search with clear error messages
- Errors now tell admins to use "Reload API Schema" button
- 10-second toast duration for schema errors vs 5-second for normal errors

#### B) Schema Reload Infrastructure ✅  
- Created `SchemaReloadControl` admin component
- Added to Admin Settings → Data Review → **Forensics tab**
- Includes:
  - **Check Health** button - tests API connectivity
  - **Reload API Schema** button - triggers pg_notify commands
  - Manual SQL instructions if automatic reload fails
  - Visual health status indicator (green/red/gray)

#### C) Job Search Resilience ✅
- Enhanced error messages with schema cache detection
- Clear instructions pointing admins to Forensics tab
- Better error handling in useJobStats hook

#### D) Documentation ✅
- `SCHEMA_CACHE_FIX_INSTRUCTIONS.md` - Complete manual fix guide
- Step-by-step SQL commands for emergency recovery
- Testing procedures
- Prevention strategies

---

## 🚨 IMMEDIATE ACTION REQUIRED

### The Supabase PostgREST API is DOWN
The migration tool cannot run because the API itself is unavailable (503 errors).

### You Must Manually Fix This:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm
   - Navigate to: SQL Editor

2. **Run These Commands** (copy/paste each):

```sql
-- Step 1: Reload schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Step 2: Reload config cache
SELECT pg_notify('pgrst', 'reload config');

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Step 4: Create reload function for future use
CREATE OR REPLACE FUNCTION public.reload_api_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'API schema and config reloaded successfully',
    'timestamp', now()
  );
END;
$$;
```

3. **Verify Fix**
   - Refresh your app
   - Go to: Admin Settings → Data Review → **Forensics tab**
   - Click **"Check Health"**
   - Should show green "Healthy" status
   - Click **"Reload API Schema"** (should now work)

4. **Test Job Search**
   - Navigate to "Search & Manage Jobs"
   - Should see populated statistics (not all zeros)
   - Should see jobs list (not "No jobs created yet")

---

## What Likely Caused This

Recent database changes created functions/views without proper:
- `SET search_path = public` in SECURITY DEFINER functions
- Fully qualified table names (e.g., `public.jobs_db`)
- Or added new tables without granting SELECT to anon/authenticated roles

The PostgREST layer couldn't read its own schema cache → 503 errors everywhere.

---

## New Features Added

### Admin → Data Review → Forensics Tab

**Schema Reload Control Card:**
- 🟢 Health Status Indicator
- ✅ "Check Health" button - one-click API test
- 🔄 "Reload API Schema" button - automatic reload
- 📋 Manual instructions if automatic fails
- ⏰ Last reload timestamp

### Better Error Messages

**Before:**
```
Failed to load jobs
Please try again
```

**After:**
```
⚠️ Database API Connection Lost
Schema cache error detected. Admin: Go to Admin Settings → 
Data Review → Forensics and click "Reload API Schema"
(10 second toast with Retry button)
```

---

## Required Screenshots (After Manual Fix)

### 1. Schema Reload Control
- Open Admin Settings → Data Review → Forensics
- Show green "Healthy" status after clicking "Check Health"
- Caption: "Schema Reload Control - Healthy Status"

### 2. Job Search Working
- Open Search & Manage Jobs
- Show populated statistics cards (numbers > 0)
- Show jobs list with actual jobs
- Caption: "Job Search Restored"

### 3. Console Clean
- Open browser dev tools console
- Show no PGRST002 errors
- Caption: "No Schema Cache Errors"

---

## Root Cause Analysis

**Problem:** PostgREST API cannot query its internal schema cache table

**Caused by:** One or more of:
1. Recent database function without `SET search_path = public`
2. View with unqualified table references
3. Trigger with ambiguous column names (like previous `record_id` issue)
4. Missing grants after new tables added
5. RLS policy with recursive query

**Fix:** Reload schema cache + ensure proper grants

**Prevention:** 
- Always use `SET search_path = public` in SECURITY DEFINER functions
- Always fully qualify table names in views/triggers
- Always grant SELECT after creating new tables
- Use the new "Reload API Schema" button after migrations

---

## Next Steps After Manual Fix

1. ✅ Run manual SQL commands above
2. ✅ Verify health check shows green
3. ✅ Test Job Search loads properly
4. ✅ Take required screenshots
5. ✅ Confirm no PGRST002 errors in console
6. ✅ Reply with: "Schema reloaded OK" + screenshots + one-line root cause

Then we can re-enable any disabled features.

---

## Files Changed

### New Files
- `src/components/admin/SchemaReloadControl.tsx` - Admin UI for schema reload
- `SCHEMA_CACHE_FIX_INSTRUCTIONS.md` - Manual fix guide
- `SCHEMA_CACHE_EMERGENCY_RESPONSE.md` - This file

### Modified Files
- `src/components/admin/DataReviewTabs.tsx` - Added Forensics tab
- `src/components/JobSearch.tsx` - Enhanced error detection
- `src/hooks/useJobStats.tsx` - Added schema error logging

---

## Testing Checklist

- [ ] Manual SQL commands executed successfully
- [ ] Health check shows "Healthy" (green)
- [ ] "Reload API Schema" button works without error
- [ ] Job Search statistics show real numbers (not zeros)
- [ ] Job Search shows job list (not empty)
- [ ] Search functionality works (try searching a job number)
- [ ] No PGRST002 errors in browser console
- [ ] Admin → Data Review → Forensics tab loads properly

---

**Status: Awaiting manual SQL execution and verification screenshots**
