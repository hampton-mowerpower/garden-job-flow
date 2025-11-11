# DATA FLOW MAP - Job Manager App
## Generated: 2025-11-11
## Status: AUDIT PHASE

---

## PHASE 0: DATA FLOW INVENTORY

### 1. DATA LOADING PATHS (READ Operations)

#### Jobs Data:
1. **Jobs List**: 
   - `src/lib/api.ts:getJobsListSimple()` → `supabase.rpc('get_jobs_list_simple')` ✅ RPC
   - `src/hooks/useJobsList.ts` → Uses above API ✅ React Query with caching
   - `src/pages/JobsSimple.tsx` → Uses useJobsList hook ✅ Correct pattern
   
2. **Job Detail**:
   - `src/lib/api.ts:getJobDetailSimple()` → `supabase.rpc('get_job_detail_simple')` ✅ RPC
   - `src/hooks/useJobDetail.ts` → Uses RPC directly (bypasses api.ts) ⚠️ Inconsistent
   - `src/pages/JobDetails.tsx` → Uses useQuery with getJobDetailSimple ✅ Correct

3. **Job Search**:
   - `src/components/JobSearch.tsx` → Direct RPC calls:
     - `supabase.rpc('search_jobs_by_phone')` ⚠️ Direct, no caching
     - `supabase.rpc('search_job_by_number')` ⚠️ Direct, no caching
     - `supabase.rpc('search_jobs_by_customer_name')` ⚠️ Direct, no caching

#### Customer Data:
1. **Customer Search**:
   - `src/components/booking/CustomerAutocomplete.tsx` → `supabase.rpc('fn_search_customers')` ⚠️ Direct
   - `src/lib/supabase-queries.ts:searchCustomers()` → `supabase.rpc('fn_search_customers')` ✅ API layer exists but not used everywhere

2. **Customer Duplicates**:
   - `src/components/CustomerManager.tsx` → `supabase.rpc('find_customer_duplicates')` ⚠️ Direct

#### Parts Data:
1. **Parts Catalogue**:
   - `src/components/parts/PartsCatalogue.tsx` → Direct `.from('parts_catalogue').select()` ❌ Direct query
   - `src/components/parts/EnhancedPartsCatalogue.tsx` → Direct `.from('parts_catalogue')` ❌ Direct query
   - `src/hooks/usePartsCatalog.tsx` → No RPC found ❌ Missing

#### Reports Data:
1. **Daily Takings**:
   - `src/components/reports/ReportsManager.tsx` → `supabase.rpc('get_daily_takings')` ⚠️ Direct
   - `src/lib/supabase-queries.ts:getDailyTakings()` → Wrapper exists ✅

2. **Technician Productivity**:
   - `src/components/reports/ReportsManager.tsx` → `supabase.rpc('get_technician_productivity')` ⚠️ Direct
   
3. **Parts Usage**:
   - `src/components/reports/ReportsManager.tsx` → `supabase.rpc('get_parts_usage_report')` ⚠️ Direct

---

### 2. DATA SAVING PATHS (WRITE Operations)

#### Jobs Mutations:
1. **Update Job Status**:
   - `src/lib/api.ts:updateJobStatus()` → `supabase.rpc('update_job_status')` ✅ RPC
   
2. **Recalculate Totals**:
   - `src/lib/api.ts:updateJobTotals()` → `supabase.rpc('recalc_job_totals')` ✅ RPC
   - `src/lib/storage.ts` → Also calls `recalc_job_totals` RPC ✅

3. **Delete Job**:
   - `src/components/JobSearch.tsx:handleDeleteJob()` → Direct `.update({ deleted_at })` ❌ Direct update

#### Parts Mutations:
1. **Add Part**:
   - `src/lib/api.ts:addJobPart()` → `supabase.rpc('add_job_part')` ✅ RPC
   - `src/components/jobs/PartsReliableEditor.tsx` → Also calls RPC directly ✅ Good
   - `src/lib/storage.ts:saveJob()` → Also calls RPC ✅ Good

2. **Update Part**:
   - `src/lib/api.ts:updateJobPart()` → `supabase.rpc('update_job_part')` ✅ RPC
   - `src/components/jobs/PartsReliableEditor.tsx` → Calls RPC ✅
   - `src/components/parts/EnhancedPartsCatalogue.tsx` → Direct `.update()` ❌ Direct update

3. **Delete Part**:
   - `src/lib/api.ts:deleteJobPart()` → `supabase.rpc('delete_job_part')` ✅ RPC
   - `src/components/jobs/PartsReliableEditor.tsx` → Calls RPC ✅
   - `src/lib/storage.ts` → Calls RPC ✅

#### Customer Mutations:
1. **Upsert Customer**:
   - `src/lib/api.ts:upsertCustomer()` → Direct `.upsert()` ❌ No RPC
   - `src/components/CustomerEdit.tsx` → Direct `.update()` ❌
   - `src/components/AccountCustomersManager.tsx` → Direct `.update()` & `.insert()` ❌
   - `src/components/CustomerManager.tsx` → Direct `.insert()` ❌
   - `src/components/booking/CustomerAutocomplete.tsx` → Audit inserts OK for logging

2. **Delete Customer**:
   - `src/components/CustomerEdit.tsx` → Direct `.delete()` ❌

3. **Merge Customers**:
   - `src/components/customers/DuplicateDetectionDialog.tsx` → Multiple direct updates ❌
     - Updates jobs, machines, invoices, reminders
     - No RPC for merge operation

#### Notes Mutations:
1. **Add Note**:
   - `src/lib/api.ts:addJobNote()` → Direct `.insert()` ❌ No RPC
   - `src/components/StaffJobNotes.tsx` → Direct `.insert()` ❌
   - `src/hooks/useJobNotes.tsx` → Direct `.insert()` ❌

#### Other Mutations:
1. **Categories/Brands/Models**:
   - `src/components/admin/CategoriesLabourAdmin.tsx` → All direct CRUD ❌
   - `src/components/brands/BrandManager.tsx` → Direct `.update()` & `.insert()` ❌
   - `src/components/machinery/MachineryModelsManager.tsx` → Direct CRUD ❌

2. **Parts Catalogue**:
   - `src/components/admin/PartsManagementAdmin.tsx` → Direct CRUD ❌
   - `src/components/parts/PartsCatalogue.tsx` → Direct CRUD ❌
   - `src/components/parts/EnhancedPartsCatalogue.tsx` → Direct CRUD ❌
   - `src/components/parts/QuickAddPartDialog.tsx` → Direct `.insert()` ❌

3. **Quick Problems**:
   - `src/components/admin/QuickProblemsAdmin.tsx` → Direct CRUD ❌
   - `src/components/booking/DraggableQuickProblems.tsx` → Direct `.update()` ❌

---

### 3. REALTIME SUBSCRIPTIONS (All have cleanup ✅)

1. **CategoriesLabourAdmin** (src/components/admin/):
   - 3 channels: categories, brands, models
   - Cleanup: ✅ `supabase.removeChannel()`

2. **EmailHealthMonitor** (src/components/admin/):
   - 1 channel: email-health
   - Cleanup: ✅

3. **PartsManagementAdmin** (src/components/admin/):
   - 1 channel: categories-changes
   - Cleanup: ✅

4. **QuickProblemsAdmin** (src/components/admin/):
   - 1 channel: admin-quick-problems
   - Cleanup: ✅

5. **DraggableQuickProblems** (src/components/booking/):
   - 1 channel: quick-problems-changes
   - Cleanup: ✅

6. **useCategories** (src/hooks/):
   - 1 channel: categories-realtime
   - Cleanup: ✅

7. **useUserRoles** (src/hooks/):
   - 1 channel: user-roles-changes
   - Cleanup: ✅

**Total Active Subscriptions: 9 channels**
**Cleanup Status: ALL HAVE PROPER CLEANUP ✅**

---

## CRITICAL ISSUES FOUND

### 🔴 HIGH PRIORITY (Block production):

1. **Direct Table Updates** (57 locations):
   - Customer mutations: No RPCs, all direct updates
   - Parts catalogue: No RPCs, all direct updates
   - Categories/Brands: No RPCs, all direct updates
   - Notes: No RPCs, all direct inserts
   - **IMPACT**: Bypasses business logic, audit trails, validation

2. **Inconsistent API Usage**:
   - Jobs: ✅ Good (uses RPCs)
   - Parts: ⚠️ Mixed (some RPCs, some direct)
   - Customers: ❌ Bad (all direct)
   - Admin tables: ❌ Bad (all direct)

3. **No React Query for Mutations**:
   - Most mutations don't use useMutation
   - No optimistic updates
   - No error retry logic
   - Poor error handling

4. **Missing API Layer**:
   - `useJobDetail` bypasses `src/lib/api.ts`
   - Reports components bypass API layer
   - Search components bypass API layer

### 🟡 MEDIUM PRIORITY:

1. **No Caching Strategy**:
   - Only 2 hooks use React Query with caching
   - Most components fetch on every render
   - No staleTime/gcTime configured consistently

2. **Duplicate Code**:
   - Multiple components doing same queries
   - No shared hooks for common operations

### 🟢 LOW PRIORITY:

1. **Code Organization**:
   - API functions spread across multiple files
   - Inconsistent naming conventions

---

## ARCHITECTURAL VIOLATIONS COUNT

| Violation Type | Count | Must Be |
|----------------|-------|---------|
| Direct table updates | 57+ | 0 |
| Timeout wrappers | 0 | 0 ✅ |
| Fallback queries | 0 | 0 ✅ |
| Untracked channels | 0 | 0 ✅ |
| Direct RPC calls (bypassing API) | 23 | 0 |
| Components without React Query | 40+ | 0 |

---

## FILES REQUIRING IMMEDIATE FIXES

### Critical (Data Integrity):
1. `src/components/CustomerEdit.tsx` - Direct updates/deletes
2. `src/components/customers/DuplicateDetectionDialog.tsx` - Merge logic
3. `src/components/parts/PartsCatalogue.tsx` - Parts CRUD
4. `src/components/parts/EnhancedPartsCatalogue.tsx` - Parts updates
5. `src/components/admin/PartsManagementAdmin.tsx` - Admin CRUD
6. `src/lib/api.ts` - Add missing RPCs

### High Priority (Consistency):
1. `src/hooks/useJobDetail.ts` - Bypass API layer
2. `src/components/JobSearch.tsx` - Direct RPCs
3. `src/components/reports/ReportsManager.tsx` - Direct RPCs
4. All admin components - Need API layer + React Query

### Medium Priority (Performance):
1. Add React Query to all data fetching
2. Add useMutation to all mutations
3. Consolidate duplicate queries

---

## NEXT STEPS

1. ✅ Complete Phase 0 audit
2. ⏳ Phase 1: Check existing RPCs in database
3. ⏳ Phase 2: Create missing RPCs
4. ⏳ Phase 3: Refactor code to use RPCs only
5. ⏳ Phase 4: Add React Query everywhere
6. ⏳ Phase 5: Live testing
7. ⏳ Phase 6: Generate fix summary
