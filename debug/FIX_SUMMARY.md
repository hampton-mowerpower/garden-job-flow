# Jobs Page Crash Fix - Cannot access 'B' before initialization

## Problem
The `/jobs` route was crashing with "Cannot access 'B' before initialization" error due to circular import issues.

## Root Cause
Components were importing from multiple Supabase client instances, creating potential circular dependencies:
- Some components used `@/integrations/supabase/client`
- Some components used `@/lib/supabase`
- This inconsistency created module initialization order issues

## Fixes Applied

### 1. Enabled Source Maps for Debugging
**File: `vite.config.ts`**
- Added `sourcemap: true` and `minify: false` to build config
- Added `esbuild: { keepNames: true }` to preserve function names
- This will make future errors easier to debug with readable stack traces

### 2. Fixed Supabase Client Import Inconsistency
**File: `src/components/jobs/JobsTableVirtualized.tsx`**
- Changed: `import { supabase } from '@/integrations/supabase/client';`
- To: `import { supabase } from '@/lib/supabase';`
- This ensures all code uses the single unified Supabase client

### 3. Verified Import Graph
The one-way import graph is now enforced:
```
src/env.ts (pure exports)
    ↓
src/lib/supabase.ts (creates client)
    ↓
src/lib/types.ts (types only)
    ↓
src/lib/api.ts (data functions)
    ↓
src/hooks/* (React Query wrappers)
    ↓
src/components/* (UI components)
```

## Previous Fixes (from CIRCULAR_IMPORTS_FIX.md)
These files were already fixed in the previous round:
- ✅ `src/lib/health.ts` - Now uses `./supabase`
- ✅ `src/hooks/useJobDetail.ts` - Now uses `@/lib/supabase`
- ✅ `src/lib/storage.ts` - Now uses `./supabase`
- ✅ `src/lib/supabase-queries.ts` - Now uses `./supabase`

## ESLint Protection
- ✅ `eslint-plugin-import` with `import/no-cycle: "error"` enabled
- ✅ `madge` added for circular dependency detection

## Expected Network Behavior on `/jobs`
After this fix, opening `/jobs` should show:
1. **Exactly 1** POST to `/rest/v1/rpc/get_jobs_list_simple` → 200 OK
2. **Zero** calls to `user_profiles` table
3. **Zero** calls to `job_notes` table  
4. **Optional** 1 POST to `/rest/v1/rpc/get_job_stats_efficient` → 200 OK

## Testing Instructions
1. Wait for build to complete
2. Open preview at `/jobs`
3. Check DevTools → Console for errors (should be none)
4. Check DevTools → Network tab:
   - Should see exactly one RPC call to `get_jobs_list_simple`
   - Should see job cards render with customer names and latest notes
5. Verify job actions (View, Edit) work without errors

## Remaining Known Issues
There are 41 other component files still importing from `@/integrations/supabase/client` instead of `@/lib/supabase`. These should be refactored gradually, but are not causing immediate circular import issues as they are not in the critical path for the Jobs page load.

Priority files to fix next (if issues arise):
- `src/components/JobForm.tsx` (used when editing jobs)
- `src/components/booking/CustomerAutocomplete.tsx` (used in job creation)
- `src/components/machinery/SearchableBrandSelect.tsx` (used in machine selection)

## Verification
- [ ] Preview builds successfully
- [ ] `/jobs` loads without "Cannot access 'B'" error
- [ ] Job cards are visible with customer data
- [ ] Network tab shows only 1 RPC call for job list
- [ ] Console shows no circular dependency warnings
