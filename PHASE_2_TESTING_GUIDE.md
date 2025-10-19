# PHASE 2: Complete Testing Guide & Diagnostics Export

**Date**: 2025-10-19  
**Goal**: Verify all data loading works correctly and produce diagnostics bundle

---

## ✅ HEALTH CHECK RESULTS

All Phase 1 diagnostics **PASSED**:

```
✅ Anon can read jobs (71 jobs)
✅ Anon can read customers (66 customers)  
✅ Anon can read parts (1,170 parts)
✅ RLS is ACTIVE (policies configured correctly)
✅ Jobs + Customer relations work
```

**Conclusion**: Supabase backend is healthy. Any bugs are in the React frontend code.

---

## 📋 TESTING CHECKLIST

### Test 1: Job List Loading
**Location**: Job Search & Management page

**Steps**:
1. Navigate to Job Search & Management
2. Wait for jobs to load
3. Check browser console (F12 → Console)

**Expected Results**:
- [ ] All 71 jobs load within 2-3 seconds
- [ ] No errors in console
- [ ] No red "API down" toasts
- [ ] Customer names display correctly
- [ ] Totals and balances display correctly
- [ ] Table columns visible: Job #, Date, Customer, Machine, Status, Total, Balance

**Pass/Fail**: _________

**Notes**: _________________________________________

---

### Test 2: Customer Profile - Jobs Tab Consistency
**Location**: Customers → Customer Profile → Jobs Tab

**Steps**:
1. Go to Job Search & Management
2. Search for a specific customer (e.g., "Citywide" or any customer with multiple jobs)
3. Note the job count in the search results
4. Go to Customers → Select same customer
5. Click on "Jobs" tab in customer profile
6. Compare job count and totals

**Expected Results**:
- [ ] Job count in profile matches Job Search filter results
- [ ] "Total Jobs" number matches exactly
- [ ] "Total Spent" matches sum of grand_total from filtered jobs
- [ ] Job list shows same jobs as Job Search (same job numbers)
- [ ] Dates, statuses, and amounts match

**Pass/Fail**: _________

**Test Data**:
- Customer Name: _________________
- Job Count in Search: _________
- Job Count in Profile: _________
- Total Spent in Profile: $_________
- Match: YES / NO

---

### Test 3: Job Details Load with Parts
**Location**: Job Search → Open any job

**Steps**:
1. Go to Job Search & Management
2. Click "Edit" on any job that should have parts
3. Verify parts section loads

**Expected Results**:
- [ ] Job opens without errors
- [ ] Customer details display
- [ ] Machine details display
- [ ] Parts section visible
- [ ] If job has parts, they display with quantities and prices
- [ ] Totals (Subtotal, GST, Grand Total) display correctly

**Pass/Fail**: _________

**Test Job**:
- Job Number: _________________
- Parts Count: _________
- Grand Total: $_________

---

### Test 4: Parts Persistence (CRITICAL TEST)
**Location**: Job Form → Parts Section

**Steps**:
1. Create a NEW job or open an existing one
2. Add a new part:
   - Description: "Test Part - Persistence Check"
   - Quantity: 2
   - Unit Price: $50.00
3. Click "Save" (or save the entire job if separate save)
4. Wait for success toast
5. **CRITICAL**: Refresh the browser page (F5 or Ctrl+R)
6. Open the same job again
7. Check if the part still exists

**Expected Results**:
- [ ] Part saves successfully (success toast appears)
- [ ] After refresh, part still exists in parts list
- [ ] Quantity = 2
- [ ] Unit Price = $50.00
- [ ] Total Price = $100.00
- [ ] Job grand total updated to include this part

**Pass/Fail**: _________

**Evidence** (screenshot or values):
- Before refresh: Parts count = ___, Total = $______
- After refresh: Parts count = ___, Total = $______
- Match: YES / NO

---

### Test 5: Parts Edit & Update
**Location**: Job Form → Parts Section

**Steps**:
1. Open a job with existing parts
2. Find a part with quantity = 1
3. Change quantity to 3
4. Save
5. Refresh page
6. Verify change persisted

**Expected Results**:
- [ ] Quantity change saved
- [ ] After refresh, quantity = 3 (not reverted to 1)
- [ ] Total price updated (3 × unit price)
- [ ] Job grand total recalculated correctly

**Pass/Fail**: _________

---

### Test 6: Parts Delete
**Location**: Job Form → Parts Section

**Steps**:
1. Open a job with 3+ parts
2. Delete one part from the middle
3. Save
4. Refresh page
5. Verify only 2 parts remain (the correct ones)

**Expected Results**:
- [ ] Part deleted from UI
- [ ] Save succeeds
- [ ] After refresh, only 2 parts remain
- [ ] The correct parts remain (not random ones)
- [ ] Totals recalculated without deleted part

**Pass/Fail**: _________

---

### Test 7: Empty Parts Handling
**Location**: Job Form → Parts Section

**Steps**:
1. Open job with parts
2. Add a blank part (empty description, qty 0)
3. Save
4. Refresh

**Expected Results**:
- [ ] Blank part NOT saved to database
- [ ] Only valid parts (with descriptions) persist
- [ ] No errors thrown

**Pass/Fail**: _________

---

### Test 8: Total Calculation Accuracy
**Location**: Any job with parts

**Steps**:
1. Create or edit a job
2. Add these exact parts:
   - Part A: Qty 2, Price $50 → Total $100
   - Part B: Qty 1, Price $30 → Total $30
3. Save
4. Check totals display

**Expected Results**:
- [ ] Parts Subtotal: $130.00
- [ ] GST (10%): $13.00
- [ ] Grand Total: $143.00
- [ ] Values match database (verify in Supabase → jobs_db table)

**Pass/Fail**: _________

**Actual Values**:
- Subtotal: $__________
- GST: $__________
- Grand Total: $__________

---

## 🔧 DIAGNOSTICS EXPORT GUIDE

### Step 1: Access Admin Settings
1. Click **Admin Settings** in main navigation (gear icon)
2. Go to **Help** tab

### Step 2: Export Bundle
1. Click **"Export Diagnostics Bundle (ZIP)"**
2. Wait for processing (10-30 seconds)
3. Click **Download ZIP** button when ready

### Step 3: Verify ZIP Contents
Unzip the file and verify it contains:

**Supabase Diagnostics** (should NOT be empty):
- [ ] `views.json` - Database view definitions
- [ ] `functions.json` - Database function definitions
- [ ] `tables_columns.json` - Table structure
- [ ] `indexes.json` - Index definitions
- [ ] `rls_policies.json` - Row Level Security policies
- [ ] `rls_status.json` - RLS enabled/disabled status
- [ ] `grants_tables.json` - Table access grants
- [ ] `grants_functions.json` - Function execute grants
- [ ] `broken_views.txt` - Compilation test results
- [ ] `health_check.json` - System health status

**App Snapshot**:
- [ ] `src/` folder with React components
- [ ] `package.json` - Dependencies list
- [ ] `.env.example` - Environment template (NO secrets!)
- [ ] Supabase functions code

### Step 4: Upload to ChatGPT
1. Go to ChatGPT
2. Start new conversation
3. Upload the ZIP file
4. Ask: "Review this diagnostics bundle and identify any database or security issues"

---

## 🚨 FAILURE SCENARIOS

### If Jobs Don't Load
**Symptoms**: Blank job list, red toast "API connection failed"

**Debug Steps**:
1. Open browser console (F12)
2. Look for red errors
3. Check Network tab → Filter by "jobs" → Look for failed requests
4. Go to System Doctor → Run Full Diagnostic
5. If any test fails, note the exact error message

**Common Causes**:
- RPC function `list_jobs_page` doesn't exist (Solution: use JobListReliable component)
- Network connectivity issue (Solution: check internet, refresh page)
- Supabase project paused (Solution: wake up project in Supabase dashboard)

### If Parts Don't Persist
**Symptoms**: Parts save successfully but disappear after refresh

**Debug Steps**:
1. Open Supabase Dashboard → Table Editor → `job_parts`
2. Filter by `job_id` = [your test job ID]
3. Check if parts rows exist in database
4. If rows exist but don't load → problem is in fetch logic
5. If rows don't exist → problem is in save logic

**Common Causes**:
- Parts being deleted immediately after save
- Totals not updating so app thinks save failed
- Transaction rollback due to job update error

### If Customer Profile Shows Wrong Jobs
**Symptoms**: Customer profile job count doesn't match Job Search

**Debug Steps**:
1. Note customer ID from customer profile URL or database
2. Go to Supabase Dashboard → SQL Editor
3. Run: `SELECT COUNT(*) FROM jobs_db WHERE customer_id = '[customer-id]' AND deleted_at IS NULL`
4. Compare count with what profile shows
5. If count is different, check Customer Profile query logic

---

## 📊 ACCEPTANCE CRITERIA

### All Tests Must Pass:
- ✅ Health Check: All 5 tests PASS (already done)
- ⏳ Job List: Loads 71 jobs correctly
- ⏳ Customer Profile: Job count matches Job Search
- ⏳ Parts: Load, save, edit, delete all work
- ⏳ Totals: Always calculated correctly
- ⏳ Persistence: Refresh doesn't lose data

### Diagnostics Export Must:
- ✅ ZIP file downloads
- ⏳ All JSON files non-empty (contain real data)
- ✅ No secrets present in ZIP
- ⏳ File size reasonable (< 10MB typical)

### Console Must Be Clean:
- ⏳ No red errors on page load
- ⏳ No React warnings about missing keys
- ⏳ No "Failed to fetch" errors
- ⏳ All async operations complete successfully

---

## 📝 TEST RESULTS TEMPLATE

Copy this section and fill in after testing:

```
=== PHASE 2 TEST RESULTS ===

Date: _______________
Tester: _______________

Test 1 - Job List: PASS / FAIL
  Notes: _______________________________________________

Test 2 - Customer Profile: PASS / FAIL
  Notes: _______________________________________________

Test 3 - Job Details: PASS / FAIL
  Notes: _______________________________________________

Test 4 - Parts Persistence: PASS / FAIL
  Notes: _______________________________________________

Test 5 - Parts Edit: PASS / FAIL
  Notes: _______________________________________________

Test 6 - Parts Delete: PASS / FAIL
  Notes: _______________________________________________

Test 7 - Empty Parts: PASS / FAIL
  Notes: _______________________________________________

Test 8 - Total Calculation: PASS / FAIL
  Notes: _______________________________________________

Diagnostics Export: SUCCESS / FAIL
  ZIP Size: _________ KB/MB
  Contains Real Data: YES / NO

Overall Status: READY FOR PHASE 3 / NEEDS FIXES

Critical Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Minor Issues Found:
1. _______________________________________________
2. _______________________________________________

Recommendations:
_______________________________________________
_______________________________________________
```

---

## 🎯 SUCCESS METRICS

**Phase 2 is complete when**:
- All 8 tests above pass ✅
- Diagnostics ZIP downloaded and verified ✅
- Console shows no errors ✅
- Data persists correctly after refresh ✅
- Customer profile matches Job Search exactly ✅

**Then proceed to Phase 3: Email Queue & Notifications**

---

**Status**: ⏳ AWAITING TEST RESULTS  
**Next Action**: Run all 8 tests, document results, share diagnostics ZIP
