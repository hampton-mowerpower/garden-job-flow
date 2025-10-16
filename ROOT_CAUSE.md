# Root Cause Analysis

## Problem
**PGRST002 Error**: PostgREST API layer cannot query its own schema cache, preventing all REST API operations.

## Root Cause
PostgREST's internal schema cache became corrupted or inaccessible, likely due to:
1. A previous migration that modified system tables or views
2. PostgREST service issue requiring a restart (only Supabase support can do this)
3. Database connection pool exhaustion or timeout

## Impact
- REST API (`/rest/v1/*`) returns PGRST002 for all requests
- Job Search, Job Details, and all data loading fails
- Database itself is healthy (direct SQL queries work)
- Only the API layer is affected

## Solution Applied
**RECOVERY_SAFE.sql** - Non-destructive, idempotent recovery script that:
1. Creates fallback functions (`get_jobs_direct`, `get_job_detail_direct`) that bypass PostgREST
2. Uses `CREATE OR REPLACE` (no DROP statements - fully safe)
3. Grants permissions to UI roles (anon, authenticated)
4. Reloads PostgREST caches via `pg_notify`
5. Wrapped in transaction with error handling (no partial state)

## Recovery Steps
1. Run `RECOVERY_SAFE.sql` in Supabase SQL Editor (one-click, safe)
2. App automatically enters fallback mode and loads jobs via direct RPC
3. Jobs List and Job Details work immediately
4. System Doctor can verify health and auto-exit fallback when PostgREST recovers

## Prevention
- Use System Doctor "Check Health" button to monitor PostgREST status
- Always use CREATE OR REPLACE for functions (never DROP)
- Reload PostgREST caches after any schema changes
- If PGRST002 persists after recovery, contact Supabase support to restart PostgREST service
