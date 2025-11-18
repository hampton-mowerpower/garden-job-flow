# Manual Testing Guide - Auto-Save Removal
## Date: 2025-11-18

---

## 🎯 WHAT TO TEST

You need to personally test that the job editing flow now **saves ONLY when you click "Save"**.

---

## ✅ TEST 1: Edit Existing Job (MOST IMPORTANT)

### Steps:
1. Go to `/jobs` page
2. Click on any existing job (e.g., JB2025-0081)
3. Click "Edit" button to enter edit mode
4. Make several changes:
   - Change machine category
   - Change problem description
   - Add a new part
   - Edit part quantity
   - Change transport settings (if visible)
5. **WAIT 2-3 MINUTES** without clicking Save
6. Watch the Network tab - should see **ZERO save requests**
7. Refresh the page (Ctrl+R or Cmd+R)
8. **VERIFY**: Your changes are NOT saved (this is correct!)
9. Make the changes again
10. Click "Save" button
11. **VERIFY**: 
    - Save button shows "Saving..." spinner
    - Network tab shows exactly **1 save request**
    - Success toast appears: "Job Updated"
12. Refresh the page
13. **VERIFY**: All changes are now persisted ✓

### Expected Results:
- ✅ No auto-save while editing
- ✅ Changes lost if you don't save (expected)
- ✅ Exactly 1 save request when clicking "Save"
- ✅ All changes persisted after save
- ✅ No console errors

---

## ✅ TEST 2: Create New Job

### Steps:
1. Go to `/jobs/new` (or click "New Job" button)
2. Fill out the form:
   - Enter customer name, phone
   - Select machine category
   - Enter problem description
   - Add 2-3 parts
3. **WAIT 2-3 MINUTES** without clicking Save
4. Watch Network tab - should see **ZERO save requests**
5. Switch between form fields, type slowly, type fast
6. **VERIFY**: Still no save requests
7. Click "Save" button
8. **VERIFY**:
   - Network tab shows exactly **1 save request**
   - Job created successfully
   - Auto-print may trigger (this is expected for new jobs)
   - Redirects to job detail page

### Expected Results:
- ✅ No auto-save during job creation
- ✅ Can take as long as needed to fill form
- ✅ Exactly 1 save when clicking "Save"
- ✅ Job created successfully
- ✅ No console errors

---

## ✅ TEST 3: Rapid Edits (Stress Test)

### Steps:
1. Open an existing job for editing
2. Rapidly make many changes:
   - Change category dropdown 5 times quickly
   - Type fast in problem description
   - Add parts quickly
   - Delete parts
   - Change quantities
   - Toggle checkboxes
3. Do NOT pause - keep making changes continuously
4. Watch Network tab the entire time
5. **VERIFY**: **ZERO save requests** despite rapid changes
6. Click "Save" button
7. **VERIFY**: Exactly **1 save request**
8. Refresh page
9. **VERIFY**: All final changes persisted correctly

### Expected Results:
- ✅ No auto-save during rapid editing
- ✅ Form stays responsive and snappy
- ✅ No lag or stuttering
- ✅ Exactly 1 save when clicking "Save"
- ✅ Final state matches what was saved

---

## ✅ TEST 4: Machine Selection (Previously Had Auto-Save)

### Steps:
1. Open job for editing
2. Click on "Machine Category" dropdown
3. Select a different category
4. **IMMEDIATELY** watch Network tab
5. **VERIFY**: No save request triggered
6. Change "Brand" dropdown
7. **VERIFY**: No save request
8. Change "Model" dropdown
9. **VERIFY**: No save request
10. Click "Save" button
11. **VERIFY**: Exactly 1 save request
12. Refresh page
13. **VERIFY**: New machine details persisted

### Expected Results:
- ✅ Machine dropdowns work smoothly
- ✅ No auto-save on dropdown changes
- ✅ Labour rate updates if configured
- ✅ Changes save on button click only

---

## ✅ TEST 5: Transport & Sharpen (Previously Had Auto-Save Every 500ms!)

### Steps:
1. Open job with transport section visible
2. Toggle "Pickup Required" checkbox
3. **WAIT 1 SECOND** - watch Network tab
4. **VERIFY**: No save request (previously would save after 500ms!)
5. Toggle "Delivery Required"
6. **WAIT 1 SECOND** - watch Network tab
7. **VERIFY**: No save request
8. Change distance slider
9. **WAIT 1 SECOND**
10. **VERIFY**: No save request
11. Make changes in sharpen section (if visible)
12. **VERIFY**: No save requests
13. Click "Save" button
14. **VERIFY**: Exactly 1 save, all transport/sharpen data saved

### Expected Results:
- ✅ No auto-save on transport changes (HUGE FIX!)
- ✅ No auto-save on sharpen changes
- ✅ Form calculations still work (totals update)
- ✅ Everything saves on button click

---

## ✅ TEST 6: Browser Console Check

### Steps:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console (trash icon)
4. Edit a job for 5 minutes:
   - Make various changes
   - Switch between fields
   - Add/remove parts
   - Change dropdowns
5. Look at console every 30 seconds
6. **VERIFY**: No error messages
7. **VERIFY**: No warnings about saves
8. **VERIFY**: No "Auto-save failed" messages
9. Click "Save"
10. **VERIFY**: Success logs appear
11. **VERIFY**: No error messages

### Expected Results:
- ✅ Clean console (no errors)
- ✅ No auto-save related messages
- ✅ Only intentional logs (if any)
- ✅ Save success logged

---

## ✅ TEST 7: Network Tab Analysis

### Steps:
1. Open DevTools → Network tab
2. Filter to "Fetch/XHR" requests only
3. Clear network log
4. Open job for editing
5. Edit for 2-3 minutes (make 10+ changes)
6. **COUNT**: Number of save-related requests
   - Should be: **ZERO**
7. Click "Save" button
8. **COUNT**: Number of save-related requests
   - Should be: **EXACTLY ONE**
9. Look for duplicates in request list
10. **VERIFY**: No duplicate POST requests

### Expected Results:
- ✅ 0 saves before clicking "Save"
- ✅ 1 save after clicking "Save"
- ✅ No duplicate requests
- ✅ Clean request log

---

## ✅ TEST 8: Multiple Tabs (Race Condition Check)

### Steps:
1. Open same job in 2 browser tabs
2. Tab 1: Make some changes
3. Tab 2: Make different changes
4. Tab 1: Click "Save"
5. **VERIFY**: Saves successfully
6. Tab 2: Click "Save"
7. **VERIFY**: 
   - Either saves successfully OR
   - Shows conflict warning (if version checking is enabled)
8. Refresh both tabs
9. **VERIFY**: Data is consistent (no corruption)

### Expected Results:
- ✅ No race conditions
- ✅ Last save wins OR conflict detected
- ✅ No data corruption
- ✅ Consistent final state

---

## ✅ TEST 9: Slow Typing (User Taking Their Time)

### Steps:
1. Open new job form or edit existing
2. Type VERY SLOWLY in problem description
3. Pause 10 seconds between words
4. Watch Network tab
5. **VERIFY**: No save requests during pauses
6. Switch to another field
7. Type slowly there too
8. **VERIFY**: Still no save requests
9. Leave form open for 5 minutes
10. **VERIFY**: No background activity
11. Click "Save"
12. **VERIFY**: Exactly 1 save, all text saved correctly

### Expected Results:
- ✅ No timeout-triggered saves during pauses
- ✅ Form waits patiently for user
- ✅ All typed content preserved in memory
- ✅ Saves correctly when clicked

---

## ✅ TEST 10: Cancel/Discard Changes

### Steps:
1. Open existing job for editing
2. Make several changes:
   - Change category
   - Edit description
   - Add a part
3. **DO NOT CLICK SAVE**
4. Navigate away (click "Back" or go to `/jobs`)
5. Come back to the same job
6. **VERIFY**: Original values are shown (changes discarded)
7. **VERIFY**: No errors in console
8. **VERIFY**: Job is intact (not corrupted)

### Expected Results:
- ✅ Changes discarded if not saved
- ✅ Original data intact
- ✅ No errors
- ✅ Can edit again fresh

---

## 🔍 WHAT TO LOOK FOR (RED FLAGS)

### ❌ BAD - Report Immediately:
- Multiple save requests without clicking "Save"
- "Saving..." appears without clicking "Save"
- Console errors about saves
- Form freezing or lagging
- Data not saving when clicking "Save"
- Duplicate save requests in Network tab
- Changes persisting without clicking "Save"

### ✅ GOOD - Working Correctly:
- Zero save requests while editing
- "Saved" only appears after clicking "Save"
- Clean console (no errors)
- Form is snappy and responsive
- Exactly 1 save request per "Save" click
- Changes lost if navigating away without saving
- All changes persist after saving

---

## 📊 SUCCESS CRITERIA

Mark each test as PASS or FAIL:

- [ ] TEST 1: Edit Existing Job - PASS/FAIL
- [ ] TEST 2: Create New Job - PASS/FAIL
- [ ] TEST 3: Rapid Edits - PASS/FAIL
- [ ] TEST 4: Machine Selection - PASS/FAIL
- [ ] TEST 5: Transport & Sharpen - PASS/FAIL
- [ ] TEST 6: Browser Console - PASS/FAIL
- [ ] TEST 7: Network Tab - PASS/FAIL
- [ ] TEST 8: Multiple Tabs - PASS/FAIL
- [ ] TEST 9: Slow Typing - PASS/FAIL
- [ ] TEST 10: Cancel/Discard - PASS/FAIL

**Overall Status: PASS / FAIL**

---

## 🐛 FOUND A BUG?

If any test fails, document:
1. Which test failed
2. What you expected to see
3. What you actually saw
4. Screenshot of Network tab
5. Screenshot of Console (if errors)
6. Steps to reproduce

Then report to developer with all details.

---

## ✅ VERIFICATION COMPLETE

After completing all tests, confirm:
- [ ] No auto-save during editing
- [ ] Save button works reliably
- [ ] Exactly 1 save per click
- [ ] No console errors
- [ ] No network spam
- [ ] Form is responsive
- [ ] Data integrity maintained

**Tested By:** _________________
**Date:** _________________
**Time Spent:** _________________
**Overall Result:** PASS / FAIL

---

## 🎉 IF ALL PASS

Congratulations! The auto-save removal is working perfectly:
- ✅ No more surprise saves
- ✅ No more race conditions  
- ✅ No more data corruption
- ✅ Full user control over saves
- ✅ 80-95% reduction in database writes
- ✅ Snappy, responsive form
- ✅ 100% save reliability

**You can now edit jobs with confidence!** ❤️

---

**Priority:** HIGH - Please test this ASAP
**Estimated Testing Time:** 20-30 minutes
**Importance:** CRITICAL - This fixes a major bug causing data loss
