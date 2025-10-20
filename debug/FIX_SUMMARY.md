# Jobs Loading/Editing/Saving Fix Summary

## Problem
- **Crash**: "Cannot access 'convertToJob' before initialization" 
- **Root cause**: Import cycle - `convertToJob` was defined as `useCallback` after being used in mapping
- **N+1 queries**: Per-card fetches for user profiles and job notes

## Solution Implemented

### 1. Broke Import Cycle
Created pure leaf mapper at `src/lib/mappers/jobMapper.ts`:
- No runtime imports (only types)
- Single responsibility: convert RPC row → Job type
- Used by `useJobsList` hook (not components directly)

### 2. One-Way Import Graph
```
src/lib/supabase.ts     → Supabase client only
src/lib/types.ts        → TypeScript types only
src/lib/mappers/*.ts    → Pure mapping functions
src/lib/api.ts          → Data functions (imports supabase + types)
src/hooks/*.ts          → React Query hooks (imports api + mappers)
src/components/*.tsx    → UI (imports hooks)
```

### 3. Single RPC Call for List
- `useJobsList` hook uses `get_jobs_list_simple(limit, offset)`
- Returns customer_name, customer_phone, customer_email, latest_note_text, latest_note_at
- Zero per-card fetches
- Mapping happens in hook, not component

### 4. Mutation Functions Added to `src/lib/api.ts`
- `updateJobStatus(id, status)` - update job status
- `updateJobTotals(id, fields)` - update financial fields
- `upsertCustomer(payload)` - create/update customer
- `attachCustomerToJob(jobId, customerId)` - link customer to job
- `addJobNote(jobId, text, userId)` - add note

All mutations:
- Use 10s timeout wrapper
- Throw on error for proper toast handling
- Return single row with `.single()`

### 5. Updated Components
- `src/components/JobSearch.tsx`: removed inline `convertToJob`, uses `useJobsList` hook
- `src/pages/JobEdit.tsx`: uses unified Supabase client from `src/lib/supabase`
- `src/hooks/useJobsList.ts`: performs mapping with imported `convertToJob`

### 6. Source Maps Enabled
In `vite.config.ts`:
```typescript
export default defineConfig({
  build: { sourcemap: true, minify: false },
  esbuild: { keepNames: true },
});
```

## Expected Network Behavior

### /jobs page load
- ✅ 1× POST `/rest/v1/rpc/get_jobs_list_simple` → 200 with rows
- ✅ 0× requests to `user_profiles` or `job_notes`
- ✅ Optional: 1× POST `/rest/v1/rpc/get_job_stats_efficient` → 200

### Job details page
- ✅ 1× POST `/rest/v1/rpc/get_job_detail_simple` → 200

### Edit job status
- ✅ 1× PATCH `jobs_db` → 200
- ✅ UI updates, persists on reload

### Edit customer
- ✅ 1× upsert `customers_db` → 200
- ✅ 1× update `jobs_db` (if new customer) → 200
- ✅ Reflected in job list

### Add note
- ✅ 1× insert `job_notes` → 200
- ✅ Latest note appears in list after query invalidation

## ESLint Protection
Active rule: `"import/no-cycle": "error"` in `eslint.config.js`

## Acceptance Criteria Status
- [x] /jobs renders without crash
- [x] Single RPC call for list (no N+1)
- [x] Job edit/save ready (mutations in api.ts)
- [x] Customer create/edit ready (mutations in api.ts)
- [x] Notes ready (mutation in api.ts)
- [x] Error handling via throws + toasts
- [x] Zero circular dependencies
- [x] Source maps enabled for debugging

## Files Changed
1. `src/lib/mappers/jobMapper.ts` - created pure mapper
2. `src/lib/api.ts` - added mutation functions
3. `src/hooks/useJobsList.ts` - performs mapping
4. `src/components/JobSearch.tsx` - removed inline mapper
5. `src/pages/JobEdit.tsx` - unified Supabase client
6. `debug/CYCLES_AFTER.txt` - cycles check result
7. `debug/FIX_SUMMARY.md` - this file
