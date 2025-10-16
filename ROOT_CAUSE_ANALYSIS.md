# Root Cause Analysis: PGRST002 Error

**Date:** 2025-01-16  
**Issue:** Job Search and Job Details pages not loading  
**Error:** PGRST002 - "Could not query the database for the schema cache"

---

## Problem Statement

The UI displays "Database API Connection Lost" and all job-related pages show empty results, despite:
- Database being healthy (SQL queries work)
- All data existing in the database
- User having run emergency SQL fix scripts

---

## Technical Diagnosis

### What's Working ✅
1. **PostgreSQL Database:** Fully operational
   - Direct SQL queries execute successfully
   - Health check function returns `{"healthy": true}`
   - All tables accessible with correct permissions
   - RPC functions work (tested: `api_health_check()`)

2. **Database Functions:** All working
   - `api_health_check()` returns success
   - `reload_api_schema()` executes without errors
   - `get_jobs_direct()` returns job data

3. **Supabase Auth:** Working
   - User authenticated successfully
   - JWT tokens valid
   - Role permissions correct

### What's Broken ❌
1. **PostgREST REST API:** Completely down
   - ALL REST endpoints return 503
   - Error code: PGRST002
   - Message: "Could not query the database for the schema cache"

### The Issue Explained

**PostgREST** is Supabase's REST API layer that sits between the UI and PostgreSQL. It:
1. Maintains an internal cache of the database schema (tables, columns, views, etc.)
2. Uses this cache to route API requests to the correct database queries
3. Must query this cache on EVERY request

**The PGRST002 error means:** PostgREST itself cannot query its OWN internal schema cache.

Think of it like this:
```
UI → PostgREST → PostgreSQL
       ❌ STUCK HERE
       (Can't read its own cache)
```

The database is fine. The issue is PostgREST's internal state is corrupted or stuck.

---

## Why Standard Fixes Don't Work

### What We Tried:
1. ✅ Sent schema reload notifications (`pg_notify('pgrst', 'reload schema')`)
   - PostgREST received them, but couldn't act on them (cache still broken)

2. ✅ Granted all permissions
   - Database permissions are correct
   - PostgREST has access to everything it needs

3. ✅ Dropped and recreated views
   - Eliminated any ambiguous column issues
   - Views compile cleanly in SQL

4. ✅ Created health check functions
   - These work because they bypass PostgREST's REST API
   - They use RPC (direct function call), not REST

### Why It's Still Broken:
PostgREST's internal schema cache is likely:
- Corrupted from a previous schema change
- Stuck in an inconsistent state
- Unable to rebuild itself even after reload signals

---

## The Solution

### Immediate Workaround (Deployed) ✅
**Direct Query Fallback:**
- UI now detects PGRST002 errors
- Automatically switches to `get_jobs_direct()` RPC function
- Bypasses REST API entirely, queries database directly
- Users can view jobs (limited functionality)

### Proper Fix (Requires Supabase Action) 🔄
**PostgREST Service Restart:**
- Only Supabase support can restart the PostgREST service
- This will clear its internal cache and rebuild from scratch
- Should resolve PGRST002 error permanently

### Steps for Full Recovery:
1. **Run EMERGENCY_SQL_FIX_V3_FINAL.sql** (one more attempt to fix via SQL)
   - Drops all potentially problematic views
   - Recreates clean views with no ambiguity
   - Sends multiple reload signals
   - Wait 30 seconds after running

2. **If still broken:** Contact Supabase Support
   - Dashboard → Settings → Support
   - Issue: "PGRST002 schema cache error - PostgREST needs service restart"
   - Project: kyiuojjaownbvouffqbm
   - Mention: "Database is healthy, RPC functions work, but REST API returns 503 on all endpoints"

---

## Comparison: Database Health vs API Health

| Component | Status | Evidence |
|-----------|--------|----------|
| PostgreSQL Database | ✅ Healthy | `SELECT * FROM api_health_check()` returns success |
| Database Permissions | ✅ Correct | All tables accessible, grants verified |
| Database Functions | ✅ Working | RPC calls succeed |
| PostgREST REST API | ❌ Down | All endpoints return 503 PGRST002 |
| PostgREST Schema Cache | ❌ Corrupted | Cannot query its own internal cache |
| UI (with fallback) | 🟡 Limited | Can view jobs via direct query |

---

## Why This Happened

Likely causes:
1. **Schema Change During Active Sessions:** A previous migration or schema change may have occurred while PostgREST was actively serving requests
2. **View with Ambiguous Columns:** A view created with `SELECT *` from multiple tables caused PostgREST to fail introspection
3. **Permission Change Timing:** Grants or revokes happened mid-request, leaving PostgREST in inconsistent state
4. **PostgREST Bug:** Known issue with PostgREST's schema cache recovery in certain edge cases

---

## Prevention for Future

1. **Always reload after schema changes:**
   ```sql
   SELECT pg_notify('pgrst', 'reload schema');
   SELECT pg_notify('pgrst', 'reload config');
   ```

2. **Never use `SELECT *` in views**
   - Always list columns explicitly
   - Use aliases for ambiguous names (e.g., `table.id AS table_id`)

3. **Test after migrations:**
   - Run health check: `SELECT * FROM api_health_check()`
   - Test REST API: `curl https://[project].supabase.co/rest/v1/`

4. **Monitor schema changes:**
   - Keep audit log of all DDL operations
   - Use migrations with version control

---

## Current Status Summary

**Database:** ✅ Fully functional  
**PostgREST:** ❌ Needs service restart  
**UI:** 🟡 Working with direct query fallback  
**User Impact:** Limited - can view jobs, search disabled  
**Next Action:** Contact Supabase support OR wait for V3 script to take effect  
