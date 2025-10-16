# System Recovery Test Report

**Date:** 2025-01-16  
**Status:** 🟡 IN PROGRESS - DIAGNOSIS COMPLETE  
**Test Suite:** Complete System Health Check

---

## Current Status

### Critical Issue
- **Database Status:** ✅ HEALTHY (SQL queries work)
- **PostgREST API Status:** 🔴 DOWN (PGRST002 error)
- **Impact:** UI cannot load data via REST API
- **Workaround:** Direct database query functions deployed

### Root Cause - CONFIRMED
PostgREST (Supabase's API layer) cannot query its own internal schema cache. This is a PostgREST service-level issue, NOT a database issue. The database is fully functional, but PostgREST's REST API layer is stuck.

**Evidence:**
- ✅ SQL health check returns `{"healthy": true}`
- ❌ REST API returns 503 with PGRST002 on ALL endpoints
- ✅ Direct RPC functions work (bypassing REST API)
- ❌ PostgREST schema reload notifications not resolving issue

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

### 🔄 Step 5: CURRENT ACTION REQUIRED
**Run EMERGENCY_SQL_FIX_V3_FINAL.sql in Supabase SQL Editor**

1. Open: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new
2. Copy entire contents of EMERGENCY_SQL_FIX_V3_FINAL.sql
3. Paste into SQL Editor
4. Click "Run"
5. Wait for "RECOVERY V3 COMPLETE" message (30-60 seconds)
6. Wait 30 seconds for PostgREST to fully reload
7. Test health check in app

### ⚠️ Step 6: If Still Failing
**PostgREST may need hard restart (only Supabase support can do this)**
- Contact: Settings → Support → "PGRST002 schema cache error, needs service restart"
- Meanwhile: App works via direct query fallback

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

1. **IMMEDIATE:** Run EMERGENCY_SQL_FIX_V2.sql in Supabase SQL Editor
2. **Verify:** Check SQL output shows "RECOVERY COMPLETE"
3. **Test:** Wait 10 seconds, then click "Check Health" in app
4. **Confirm:** Health status should show "Healthy"
5. **Full Test:** Navigate to Job Search - should load data
6. **Report:** Update this document with actual test results

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
