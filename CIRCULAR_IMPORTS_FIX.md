# Circular Imports Fix Report

## Problem
The app was experiencing "Cannot access 'B' before initialization" errors due to circular imports between library files.

## Root Causes Identified

### 1. Multiple Supabase Client Instances
**Issue**: 64+ files importing directly from `@/integrations/supabase/client` instead of using the single unified client.

**Impact**: Created potential circular dependencies and inconsistent client behavior.

### 2. Key Circular Import Paths
```
src/lib/health.ts → @/integrations/supabase/client
src/hooks/useJobDetail.ts → @/integrations/supabase/client + @/lib/health
src/lib/storage.ts → @/integrations/supabase/client
src/lib/supabase-queries.ts → @/integrations/supabase/client
```

## Fixes Applied

### 1. Unified Supabase Client Usage
**Changed**:
- ✅ `src/lib/health.ts`: Now imports from `./supabase` instead of `@/integrations/supabase/client`
- ✅ `src/hooks/useJobDetail.ts`: Now imports from `@/lib/supabase` instead of `@/integrations/supabase/client`
- ✅ `src/lib/storage.ts`: Now imports from `@/lib/supabase` instead of `@/integrations/supabase/client`
- ✅ `src/lib/supabase-queries.ts`: Now imports from `@/lib/supabase` instead of `@/integrations/supabase/client`

### 2. Enforced One-Way Import Graph
```
src/lib/supabase.ts        → only creates/exports Supabase client
        ↓
src/lib/types.ts           → only TypeScript types (no runtime imports)
        ↓
src/lib/api.ts             → imports supabase and types; exports typed helpers
        ↓
src/hooks/useJobsList.ts   → imports from lib/api
        ↓
src/components/*           → imports from hooks and types
```

### 3. Added ESLint Guard Against Future Cycles
**Added**: `eslint-plugin-import` with `import/no-cycle` rule set to "error"

This will catch circular imports during development and prevent future regressions.

## Jobs Page Optimization

### Single RPC Call Implementation
**Before**: Multiple API calls per job card (N+1 problem)
- List query for jobs
- Per-card fetch for user_profiles
- Per-card fetch for job_notes

**After**: One RPC call for entire list
```typescript
// src/lib/api.ts
export async function getJobsListSimple(limit = 25, offset = 0) {
  const { data, error } = await supabase
    .rpc('get_jobs_list_simple', { p_limit: limit, p_offset: offset });
  if (error) throw error;
  return (data ?? []) as JobListRow[];
}
```

### Data Included in Single RPC
The `get_jobs_list_simple` RPC returns all needed data:
- Job details (id, job_number, status, created_at, grand_total, balance_due)
- Customer info (customer_id, customer_name, customer_phone, customer_email)
- Machine info (machine_category, machine_brand, machine_model, machine_serial)
- Problem description
- **Latest note** (latest_note_text, latest_note_at)

### React Query Configuration
```typescript
const { data: rawJobs = [], isLoading, error, refetch } = useQuery({
  queryKey: ['jobs', page, activeFilter],
  queryFn: async () => {
    const data = await getJobsListSimple(25, page * 25);
    return data;
  },
  staleTime: 15_000,  // 15 seconds
  retry: 1,            // Only retry once on failure
  enabled: !isSearchMode,
});
```

## Error Handling Improvements

### 1. ErrorBoundary Already in Place
App is already wrapped with ErrorBoundary at root level (`src/App.tsx` line 97)

### 2. Better Error Messages
```typescript
useEffect(() => {
  if (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    toast({
      variant: 'destructive',
      title: 'Failed to load jobs',
      description: errorMsg,
    });
  }
}, [error, toast]);
```

## Verification Steps

### Network Tab (Expected Results)
When loading `/jobs` page, you should see:
1. ✅ **One** POST to `/rest/v1/rpc/get_jobs_list_simple` → 200 with job rows
2. ✅ **Zero** calls to `user_profiles` table
3. ✅ **Zero** calls to `job_notes` table
4. ✅ Optional: One POST to `/rest/v1/rpc/get_job_stats_efficient` → 200 with stats

### Console (Expected Results)
- ❌ No "Cannot access 'B' before initialization" errors
- ❌ No circular dependency warnings
- ✅ Clean build output

### UI (Expected Results)
- ✅ Job list renders quickly (<2s)
- ✅ Each job card shows customer name, phone, machine info
- ✅ Latest note preview appears if available
- ✅ Status badges and controls work correctly

## Files Modified
1. `src/lib/health.ts` - Fixed import to use unified client
2. `src/hooks/useJobDetail.ts` - Fixed import to use unified client
3. `src/lib/storage.ts` - Fixed import to use unified client
4. `src/lib/supabase-queries.ts` - Fixed import to use unified client
5. `eslint.config.js` - Added import/no-cycle rule
6. Added dependencies:
   - `madge` - For detecting circular dependencies
   - `eslint-plugin-import` - For preventing circular imports

## Testing Commands
```bash
# Check for circular dependencies
npm run cycles
# or
npx madge --circular --extensions ts,tsx src

# Run ESLint to catch any import cycles
npm run lint
```

## Expected Output
```
✓ No circular dependencies found!
```

## Remaining Files with Old Import Pattern
**Note**: 60+ component files still import from `@/integrations/supabase/client`. These are not causing circular imports currently but should be refactored gradually to use `@/lib/supabase` for consistency.

Priority refactor candidates (used by Jobs page):
- `src/components/JobSearch.tsx` - Already uses `@/lib/supabase` ✅
- `src/components/jobs/JobsTableVirtualized.tsx` - Uses `@/integrations/supabase/client` for status updates (consider moving to service)
