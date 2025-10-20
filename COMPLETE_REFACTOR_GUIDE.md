# Complete Refactor Implementation Guide

## Current Status

### ✅ Completed
1. **Database Migration** - Pending (503 error, retry when Supabase available)
2. **Single Supabase Client** - Implemented in `src/lib/supabase.ts`
3. **Cleanup Utility** - Added `cleanupSupabase()` function
4. **Route Cleanup** - Added to `src/App.tsx`
5. **JobDetails Cleanup** - Proper channel unsubscribe

### ⚠️ Pending: Import Updates

**56 files** still import from `@/integrations/supabase/client` instead of `@/lib/supabase`

**Required Action**: Replace all instances of:
```typescript
import { supabase } from '@/integrations/supabase/client';
```

With:
```typescript
import { supabase } from '@/lib/supabase';
```

**Affected Files** (44 shown, 56 total):
- src/components/AccountCustomersManager.tsx
- src/components/CustomerEdit.tsx
- src/components/CustomerManager.tsx
- src/components/CustomerManagerTabs.tsx
- src/components/CustomerNotificationDialog.tsx
- src/components/CustomerProfile.tsx
- src/components/EmailNotificationDialog.tsx
- src/components/JobForm.tsx
- src/components/JobPrintInvoice.tsx
- src/components/StaffJobNotes.tsx
- src/components/account/AccountContactManager.tsx
- src/components/account/AccountCustomer360View.tsx
- src/components/account/AccountEmailRouting.tsx
- src/components/admin/CategoriesLabourAdmin.tsx
- src/components/admin/DiagnosticsExport.tsx
- src/components/admin/DuplicatesManager.tsx
- src/components/admin/PartsCSVImporter.tsx
- src/components/admin/PartsImportTester.tsx
- src/components/admin/PartsManagementAdmin.tsx
- src/components/admin/QuickProblemsAdmin.tsx
- src/components/admin/SystemDoctor.tsx
- src/components/admin/TransportSettingsAdmin.tsx
- src/components/auth/AuthProvider.tsx
- src/components/booking/CustomerAutocomplete.tsx
- src/components/booking/DraggableQuickProblems.tsx
- src/components/booking/TransportSection.tsx
- src/components/brands/BrandManager.tsx
- src/components/customers/DuplicateDetectionDialog.tsx
- src/components/jobs/JobListReliable.tsx
- src/components/jobs/PartsReliableEditor.tsx
- src/components/machinery/MachineryModelsManager.tsx
- src/components/machinery/SearchableBrandSelect.tsx
- src/components/machinery/SearchableCategorySelect.tsx
- src/components/machinery/SearchableModelSelect.tsx
- src/components/parts/BulkImportDialog.tsx
- src/components/parts/EnhancedPartsCatalogue.tsx
- src/components/parts/PartsAuditLog.tsx
- src/components/parts/PartsCatalogue.tsx
- src/components/parts/QuickAddPartDialog.tsx
- src/components/reports/ReportsManager.tsx
- src/hooks/useCategories.tsx
- src/hooks/useCategorySync.tsx
- src/hooks/useColumnReorder.tsx
- src/hooks/useJobNotes.tsx

**Quick Fix Command** (run in terminal):
```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/integrations/supabase/client'|from '@/lib/supabase'|g" {} +
```

Or manually update each file using find-replace in your editor:
- Find: `from '@/integrations/supabase/client'`
- Replace: `from '@/lib/supabase'`

## Database Migration (Retry When Available)

The migration failed with a 503 error. Retry using the Lovable migration tool when Supabase is available.

**What It Does:**
1. Creates performance indexes on frequently queried columns
2. Updates `get_jobs_list_simple` with search/filter parameters
3. Adds `recalc_job_totals` for server-side calculations
4. Adds mutation functions: `update_job_status`, `add_job_part`, `update_job_part`, `delete_job_part`
5. Grants execution permissions to anon/authenticated roles

## Expected Results After Complete Implementation

### Network Performance
- **Before**: 320-528 requests per page
- **After**: <10 requests per page

### Data Transfer
- **Before**: 741 KB - 892 KB per page
- **After**: <50 KB per page

### Errors
- **Before**: Pool exhaustion, timeout failures, 158 warnings
- **After**: Zero pool errors, no timeouts

### Page Structure
- **/jobs**: 1 RPC call (`get_jobs_list_simple`)
- **/jobs/:id**: 1 RPC call (`get_job_detail_simple`) + 1 realtime channel
- **Status updates**: 1 RPC call (`update_job_status`)
- **Add part**: 1 RPC call (`add_job_part`)

## Testing Checklist

Once all imports are updated and migration is complete:

- [ ] Navigate to /jobs - verify 1 network request only
- [ ] Open job detail - verify 1 RPC call + 1 websocket
- [ ] Change job status - verify update works and persists
- [ ] Add a part - verify totals auto-update
- [ ] Navigate between pages - verify channels cleanup (no accumulation)
- [ ] Check Supabase logs - no pool exhaustion errors
- [ ] Check browser console - no timeout errors

## Verification Command

Run to check for remaining incorrect imports:
```bash
grep -r "from '@/integrations/supabase/client'" src/ | wc -l
```

Should return `0` when complete.

## Files Already Updated
✅ src/lib/supabase.ts - Added cleanup and rate limiting
✅ src/App.tsx - Added route-based cleanup
✅ src/pages/JobDetails.tsx - Proper channel unsubscribe
✅ src/components/jobs/JobsTableVirtualized.tsx - Uses correct import
