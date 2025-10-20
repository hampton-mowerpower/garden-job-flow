# Circular Dependency Check

## Import Chain Analysis

### Core Library Layer
1. `src/env.ts` - Pure exports, no imports from app code ✓
2. `src/lib/supabase.ts` - Imports from `@/env` only ✓
3. `src/lib/types.ts` - Types only, no runtime imports ✓
4. `src/lib/api.ts` - Imports from `./supabase` and `./types` only ✓

### Hook Layer
5. `src/hooks/useJobsList.ts` - Imports from `@/lib/api` only ✓
6. `src/hooks/useJobStats.tsx` - Imports from `@/lib/api` only ✓

### Component Layer
7. `src/components/JobSearch.tsx` - Imports from:
   - `@/lib/supabase` ✓
   - `@/lib/api` ✓
   - `@/hooks/*` ✓
   - Other components ✓

8. `src/components/jobs/JobsTableVirtualized.tsx` - Fixed to import from:
   - `@/lib/supabase` ✓ (was using @/integrations/supabase/client)

## Changes Made
1. Updated `vite.config.ts` to enable source maps and disable minification for debugging
2. Fixed `JobsTableVirtualized.tsx` to use unified Supabase client from `@/lib/supabase`

## One-Way Import Graph Enforced
```
src/env.ts
    ↓
src/lib/supabase.ts
    ↓
src/lib/types.ts
    ↓
src/lib/api.ts
    ↓
src/hooks/*
    ↓
src/components/*
```

## ESLint Guard
- `eslint-plugin-import` with `import/no-cycle: "error"` is enabled ✓

## Network Verification Required
After build completes, verify on `/jobs`:
1. Exactly 1 POST to `/rest/v1/rpc/get_jobs_list_simple` → 200
2. Zero calls to `user_profiles` or `job_notes`
3. Optional 1 POST to `/rest/v1/rpc/get_job_stats_efficient` → 200
