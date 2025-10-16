# System Recovery Test Report

**Date:** 2025-10-16  
**Status:** 🔴 CRITICAL - V4 FIX REQUIRED  
**Test Suite:** Complete System Health Check

---

## Current Status

### Critical Issue
- **Database Status:** ✅ HEALTHY (SQL queries work)
- **PostgREST API Status:** 🔴 DOWN (PGRST002 error)
- **Fallback RPC Status:** 🔴 BROKEN (SQL aggregate error)
- **Impact:** UI cannot load ANY data (REST AND fallback both failing)
- **V4 Fix:** Required - SQL script ready to run

### Root Cause - DOUBLE FAILURE CONFIRMED

**Issue 1: PostgREST PGRST002 (Still Present)**
PostgREST (Supabase's API layer) cannot query its own internal schema cache.

**Issue 2: Fallback RPC SQL Error (NEW - CRITICAL)**
The V3 fallback function `get_jobs_direct()` has a SQL aggregate error:
```
ERROR: column "j.created_at" must appear in the GROUP BY clause 
       or be used in an aggregate function
CONTEXT: PL/pgSQL function get_jobs_direct(integer,integer)
```

**Why This Happened:**
V3 used `jsonb_agg()` (aggregate) with `ORDER BY` + `LIMIT`. PostgreSQL requires all ORDER BY columns to be in GROUP BY when using aggregates, but you can't use GROUP BY with LIMIT on ungrouped data.

**Evidence:**
- ✅ SQL health check returns `{"healthy": true}` (DB is fine)
- ❌ REST API returns 503 with PGRST002 on ALL endpoints
- ❌ Direct RPC `get_jobs_direct()` fails with aggregate error
- ❌ Jobs cannot load via ANY method

---

## Recovery Steps Taken

### ✅ Step 1: Created and Ran EMERGENCY_SQL_FIX.sql
- Initial schema reload attempt
- Result: SQL executed successfully, but PostgREST still down

### ✅ Step 2: Created and Ran EMERGENCY_SQL_FIX_V2.sql
- Comprehensive recovery with permissions
- Result: SQL executed successfully, database healthy, but PostgREST still returning 503

### ✅ Step 3: Created EMERGENCY_SQL_FIX_V3_FINAL.sql
- **Complete PostgREST reset strategy:**
  - Drops ALL views that might have ambiguous columns
  - Recreates essential views with fully qualified column names
  - Grants comprehensive permissions to all roles
  - Creates direct query functions (bypasses REST API)
  - Creates health check function
  - Sends multiple PostgREST reload signals
- **Location:** Project root directory

### ✅ Step 4: Deployed Direct Query Fallback in UI
- Created `useJobsDirectFallback` hook
- Uses RPC function `get_jobs_direct()` to bypass REST API
- UI automatically switches to direct mode after 2 failed API attempts
- Job Search now shows yellow alert when in direct mode

### ✅ Step 5: Created EMERGENCY_SQL_FIX_V4_FINAL.sql
**Fixes the fallback RPC function to work immediately**

**Key Changes in V4:**
- Changed `get_jobs_direct()` from returning `jsonb` to returning `TABLE`
- Returns explicit columns instead of aggregate (no GROUP BY needed)
- Added `get_job_detail_direct()` for single job queries
- Updated permissions for both functions
- Includes automatic test suite

### 🔄 Step 6: CURRENT ACTION REQUIRED
**Run EMERGENCY_SQL_FIX_V4_FINAL.sql in Supabase SQL Editor NOW**

1. Open: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new
2. Copy entire contents of **EMERGENCY_SQL_FIX_V4_FINAL.sql** (in project root)
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "V4 FIX COMPLETE" message (10-20 seconds)
6. **Refresh your app** - jobs should load immediately in fallback mode
7. Look for yellow "Fallback Mode" banner (means it's working)

### ⚠️ Step 7: After Jobs Load (Fix PostgREST)
Once jobs load in fallback mode, we still need to fix the PostgREST REST API:
1. Check Forensics → Check Health to see if REST is still PGRST002
2. If still down, investigate:
   - Wrong env keys? (SUPABASE_URL, SUPABASE_ANON_KEY)
   - Missing permissions? (SELECT on tables/views)
   - Broken views? (ambiguous columns)
   - RLS blocking reads?
3. Contact Supabase support if PostgREST needs hard restart

---

## Test Results (Will Update After Recovery)

### 🔴 Critical Tests - NOT TESTED (API Down)
- [ ] Job Search loads with data
- [ ] Job Details page opens
- [ ] Customer → Jobs tab shows data
- [ ] Search functionality works
- [ ] Status updates work

### 🔴 Admin Tools - NOT TESTED (API Down)
- [ ] System Doctor health checks pass
- [ ] Data Forensics loads
- [ ] Reload API Schema button works

### 🔴 Data Integrity - NOT TESTED (API Down)
- [ ] Carrie profile shows only JB2025-0061
- [ ] job0028 linked to Stephen Swirgoski

---

## Expected Results After Running SQL Fix

### ✅ Immediate (within 10 seconds)
1. PostgREST schema cache reloaded
2. All permissions granted to API roles
3. Health check function callable
4. API returns 200 OK on queries

### ✅ UI Recovery (after page reload)
1. Job Search displays job list
2. No red error toasts
3. Job Details pages open
4. System Doctor shows all green

### ⚠️ If Still Failing
Check SQL output for:
- Broken views (will show specific view name + error)
- Permission errors (will show which table/operation failed)
- Function compilation errors

---

## Next Steps

1. **IMMEDIATE:** Run **EMERGENCY_SQL_FIX_V4_FINAL.sql** in Supabase SQL Editor
2. **Verify:** Check SQL output shows "V4 FIX COMPLETE"
3. **Refresh:** Reload your app in browser
4. **Confirm:** Jobs list should load with yellow "Fallback Mode" banner
5. **Test:** Click on a job - Job Details should open
6. **Check Health:** Admin → Forensics → Check Health to see PostgREST status
7. **Report:** Update this document with actual test results

---

## Technical Details

### Error Analysis
```
Error: PGRST002
Message: "Could not query the database for the schema cache. Retrying."
Frequency: Every API call
Components Affected: All (Job Search, Details, Stats, Admin tools)
```

### Why This Happened
PostgREST maintains an internal cache of the database schema. When it cannot query this cache:
1. Recent schema changes (views, functions, tables) may have broken something
2. Permissions on internal tables might be insufficient
3. A view with ambiguous columns might be blocking schema introspection
4. Search path issues in SECURITY DEFINER functions

### The Fix
The V2 script:
1. Forces schema reload via pg_notify
2. Grants comprehensive permissions on ALL objects
3. Tests every view for compilation errors
4. Creates simple health check functions
5. Verifies permissions post-fix
6. Provides diagnostic output for debugging

---

## Sign-Off

### After Recovery (To Be Completed)
- [ ] All critical tests pass
- [ ] Screenshots captured (Job List, Job Details, System Doctor)
- [ ] Root cause documented
- [ ] Preventive measures in place
- [ ] System marked as HEALTHY

**Tester:** _________________  
**Date/Time:** _________________  
**Final Status:** _________________

---

## Notes
_Space for additional observations, issues, or recommendations_
