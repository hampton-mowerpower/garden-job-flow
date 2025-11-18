# Manual Test Script - Parts & Costs Fix Verification
## CRITICAL: Follow these exact steps

---

## 🎯 Test Job: JB2025-0081

Based on console logs, this job has:
- **Parts Subtotal**: $201.00
- **Customer**: Jo Lee (0430478722)
- **Machine**: Husqvarna Lc142i (Battery Lawn Mower)
- **Grand Total**: $308.42

This is the PERFECT test case! It has parts in the database that were previously not showing in the edit form.

---

## ✅ TEST 1: Verify Parts Now Load (THE BIG FIX!)

### Steps:
1. Go to Jobs page: `/jobs`
2. Search for job: `JB2025-0081`
3. Click on the job to open details
4. Click "Edit" button (should go to `/jobs/c222eeb6-8939-428f-af5d-e47914e4a348/edit`)
5. **CRITICAL CHECK**: Look at the Parts & Costs section
6. **VERIFY**: Parts are now visible! (Before fix: would be empty)
7. **VERIFY**: Parts subtotal shows $201.00
8. **CHECK CONSOLE**: Should see `[JobEdit] Loaded parts:` with array of parts

### Expected Result:
✅ **BEFORE FIX**: Parts section was EMPTY (hardcoded to [])
✅ **AFTER FIX**: Parts section shows all parts with correct data

### If parts still don't show:
1. Open browser console (F12)
2. Look for `[JobEdit] Loaded parts:` log
3. Check if array has items
4. If array is empty → problem is in database
5. If array has items but UI empty → problem in mapping

---

## ✅ TEST 2: Add New Parts & Verify Persistence

### Steps:
1. While in edit mode for JB2025-0081
2. Add a new test part:
   - Part Name: "TEST PART - DELETE ME"
   - SKU: "TEST-001"
   - Quantity: 2
   - Unit Price: $25.00
   - Total should be: $50.00
3. Click "Save" button
4. Wait for success toast
5. **Don't close the page yet!**
6. Go back to jobs list (click "Back" or navigate to `/jobs`)
7. Find and click on JB2025-0081 again
8. Click "Edit" button
9. **VERIFY**: The test part is still there!
10. **VERIFY**: All existing parts are still there too!
11. **VERIFY**: Parts subtotal increased by $50.00 (now $251.00)

### Expected Result:
✅ New part persists after save + reopen
✅ Existing parts are not lost
✅ Calculations are correct

---

## ✅ TEST 3: Edit Existing Part

### Steps:
1. Still in edit mode for JB2025-0081
2. Find the test part we just added
3. Change quantity from 2 to 5
4. Total should update to: $125.00
5. Click "Save"
6. Go back and reopen the job for editing
7. **VERIFY**: Quantity is now 5 (not 2!)
8. **VERIFY**: Total is $125.00 (not $50.00!)

### Expected Result:
✅ Part edits persist correctly

---

## ✅ TEST 4: Delete Test Part (Cleanup)

### Steps:
1. In edit mode for JB2025-0081
2. Find the "TEST PART - DELETE ME" part
3. Click the delete/remove button for that part
4. **VERIFY**: Part disappears from list immediately
5. **VERIFY**: Parts subtotal decreases by $125.00 (back to $201.00)
6. Click "Save"
7. Go back and reopen job for editing
8. **VERIFY**: Test part is GONE (not there anymore)
9. **VERIFY**: Original parts are all still there
10. **VERIFY**: Parts subtotal is back to $201.00

### Expected Result:
✅ Deleted parts stay deleted
✅ Other parts unchanged

---

## ✅ TEST 5: Create Brand New Job With Parts

### Steps:
1. Go to `/jobs/new` (or click "New Job" button)
2. Fill out customer info:
   - Name: "Test Customer For Parts Fix"
   - Phone: "0400000001"
   - Address: "123 Test St"
3. Fill out machine info:
   - Category: "Lawn Mower"
   - Brand: "Test Brand"
   - Model: "Test Model"
   - Problem: "Testing parts persistence"
4. Add 3 parts:
   - Part 1: "Part A", Qty: 1, Price: $10
   - Part 2: "Part B", Qty: 2, Price: $20 (Total: $40)
   - Part 3: "Part C", Qty: 3, Price: $30 (Total: $90)
5. **VERIFY**: Grand total includes all parts ($10 + $40 + $90 + GST)
6. Click "Save"
7. Note the job number (will be like JB2025-XXXX)
8. Go back to jobs list
9. Find the job you just created
10. Click "Edit"
11. **VERIFY**: ALL 3 PARTS ARE THERE!
12. **VERIFY**: Quantities and prices are correct

### Expected Result:
✅ New jobs save parts correctly
✅ Parts persist after creation

---

## ✅ TEST 6: Browser Refresh Test

### Steps:
1. Open JB2025-0081 for editing
2. Add a temporary part: "REFRESH TEST", Qty: 1, Price: $99
3. Click "Save"
4. Success toast should appear
5. **Do a hard browser refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
6. Navigate back to JB2025-0081
7. Click "Edit"
8. **VERIFY**: "REFRESH TEST" part is still there
9. Delete the test part and save to clean up

### Expected Result:
✅ Browser refresh doesn't lose data

---

## ✅ TEST 7: Network Verification (DevTools)

### Steps:
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Clear network log (trash icon)
4. Navigate to JB2025-0081 edit page
5. **CHECK NETWORK**:
   - Should see `get_job_detail_simple` RPC call
   - Click on it → Preview/Response tab
   - **VERIFY**: Response contains `parts` array
   - **VERIFY**: Parts array has objects with `id`, `description`, `quantity`, `unit_price`
6. Add a part: "NETWORK TEST", Qty: 1, Price: $88
7. Click "Save"
8. **CHECK NETWORK**:
   - Should see multiple `add_job_part` RPC calls (one per new part)
   - OR see `delete_job_part` + `add_job_part` calls (if replacing old parts)
   - **VERIFY**: All calls return 200 OK
9. Go back and reopen job for editing
10. **CHECK NETWORK** again:
    - `get_job_detail_simple` response should include the new part
11. Delete the test part and save to clean up

### Expected Result:
✅ Network shows proper data flow
✅ RPC calls succeed (200 OK)
✅ Parts data flows correctly

---

## ✅ TEST 8: Console Error Check

### Steps:
1. Open browser console (F12 → Console tab)
2. Clear console
3. Perform TEST 1-7 above (all the tests)
4. **LOOK FOR ERRORS**:
   - NO red errors about parts
   - NO "Cannot read property of undefined"
   - NO "Failed to load parts"
   - NO "Failed to save parts"
5. **LOOK FOR SUCCESS LOGS**:
   - Should see `[JobEdit] Loaded parts:` with data
   - Should see `[saveJob] Saving X parts for job...`
   - Should see `[saveJob] All parts saved via RPC`

### Expected Result:
✅ Clean console (no errors)
✅ Success logs present

---

## 🚨 FAILURE SCENARIOS

### If parts STILL don't load after the fix:

**Scenario A: Console shows empty parts array**
```javascript
[JobEdit] Loaded parts: []
```
**Diagnosis**: Database has no parts for this job
**Fix**: This is expected if job has no parts! Try a different job OR add parts first

**Scenario B: Console shows parts but UI is empty**
```javascript
[JobEdit] Loaded parts: [{...}, {...}]
// But form shows no parts
```
**Diagnosis**: Mapping issue between parts data and JobForm
**Fix**: Check the mapping code in JobEdit.tsx lines 189-199

**Scenario C: Parts load but disappear after save**
```javascript
// Parts show initially
// After save → parts gone
```
**Diagnosis**: Save is not including parts OR save is clearing parts
**Fix**: Check `src/lib/storage.ts` saveJob function, lines 293-378

**Scenario D: Console error when loading parts**
```javascript
❌ Error: [some error message]
```
**Diagnosis**: RPC call failed
**Fix**: Check Supabase function `get_job_detail_simple` exists and works

---

## 📊 VERIFICATION CHECKLIST

After completing all tests, confirm:

- [ ] TEST 1: Existing parts now load in edit form ✅
- [ ] TEST 2: New parts persist after save ✅
- [ ] TEST 3: Part edits persist ✅
- [ ] TEST 4: Deleted parts stay deleted ✅
- [ ] TEST 5: Brand new jobs save parts correctly ✅
- [ ] TEST 6: Browser refresh doesn't lose parts ✅
- [ ] TEST 7: Network shows correct data flow ✅
- [ ] TEST 8: Console has no errors ✅

**Overall Status**: PASS / FAIL

---

## 🎉 SUCCESS CRITERIA

**ALL TESTS MUST PASS**

If any test fails:
1. Note which test failed
2. Copy console logs
3. Take screenshot of Network tab
4. Report back with details

If all tests pass:
- ✅ Parts & Costs feature is FIXED!
- ✅ Data persistence is working!
- ✅ Ready for production!

---

## 🔧 QUICK DEBUG COMMANDS

If you need to debug, paste these in browser console:

```javascript
// Check if parts are loading
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('Parts data in component:', 
      document.querySelector('[data-parts]')?.dataset?.parts
    );
  }, 2000);
});

// Monitor RPC calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]?.includes('get_job_detail_simple')) {
    console.log('🔵 Fetching job detail...');
  }
  if (args[0]?.includes('add_job_part')) {
    console.log('🔵 Adding part...');
  }
  if (args[0]?.includes('delete_job_part')) {
    console.log('🔵 Deleting part...');
  }
  return originalFetch.apply(this, args).then(res => {
    const clonedRes = res.clone();
    clonedRes.json().then(data => console.log('Response:', data));
    return res;
  });
};
```

---

**Tester**: _________________
**Date**: _________________
**Time Started**: _________________
**Time Completed**: _________________
**Result**: PASS / FAIL
**Notes**: _________________

---

**REMINDER**: The fix was critical - parts were being hardcoded to empty array! This test confirms the fix works. Be thorough! ❤️
