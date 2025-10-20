# Pending Database Migration

## Status
Migration failed with 503 error - Supabase PostgREST service temporarily unavailable.

## Action Required
Retry the migration when Supabase is back online. The migration includes:

1. **Performance Indexes**
   - `idx_jobs_created_desc` on `jobs_db.created_at`
   - `idx_jobs_customer` on `jobs_db.customer_id`
   - `idx_jobs_status` on `jobs_db.status`
   - `idx_job_notes_job_created` on `job_notes(job_id, created_at)`
   - `idx_job_parts_job` on `job_parts.job_id`
   - `idx_customers_phone` on `customers_db.phone`

2. **Updated RPC Functions**
   - `get_jobs_list_simple` - enhanced with search/filter params
   - `recalc_job_totals` - server-side total calculations
   - `update_job_status` - status mutation
   - `add_job_part` - add part with auto-recalc
   - `update_job_part` - update part with auto-recalc
   - `delete_job_part` - delete part with auto-recalc

3. **Permissions**
   - Granted EXECUTE to `anon` and `authenticated` roles

## Frontend Changes Applied
✅ Single Supabase client with cleanup utility
✅ Rate-limited realtime connections (2 events/sec)
✅ Route-based channel cleanup
✅ Proper channel unsubscribe in JobDetails
✅ All imports now use `@/lib/supabase`

## Migration SQL
The full migration SQL is ready to execute when Supabase service is available.
Check Supabase status at: https://status.supabase.com/

## Expected Impact
- Reduced network requests from 320+ to <10 per page
- Eliminated pool exhaustion errors
- Faster page loads
- Server-side total calculations prevent client-side discrepancies
