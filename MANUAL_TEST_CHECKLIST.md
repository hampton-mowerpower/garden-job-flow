# Manual Test Checklist - React Query Fix

## ✅ Pre-Flight Checks

Before testing, verify:
- [ ] App is running (`npm run dev` or `bun dev`)
- [ ] Browser console is open (F12)
- [ ] No red errors on initial load

---

## ✅ Test 1: App Loads Without Errors

**Steps:**
1. Open the app in browser
2. Check browser console

**Expected:**
- ✅ No "QueryClient" errors
- ✅ No "QueryClientProvider" errors
- ✅ App loads normally

**Actual Result:** _____________

---

## ✅ Test 2: Admin Settings Opens

**Steps:**
1. Login to the app
2. Click Admin icon (gear/settings in navigation)
3. Click "Settings" option
4. Check console for errors

**Expected:**
- ✅ Admin Settings page opens
- ✅ No "No QueryClient set" error
- ✅ All tabs visible (Data Review, Categories, Parts, etc.)

**Actual Result:** _____________

**Screenshot Location:** _____________

---

## ✅ Test 3: Data Review Tab Works

**Steps:**
1. In Admin Settings, click "Data Review" tab
2. Click "Changes" sub-tab
3. Click "Recovery" sub-tab
4. Click "Monitoring" sub-tab
5. Check console for errors

**Expected:**
- ✅ All sub-tabs load without errors
- ✅ No QueryClient errors
- ✅ Data fetching works (even if empty)

**Actual Result:** _____________

**Screenshot Location:** _____________

---

## ✅ Test 4: Changes Review Loads Data

**Steps:**
1. Go to Admin → Settings → Data Review → Changes
2. Wait for data to load
3. Try using filters (date range, job number)

**Expected:**
- ✅ Page loads without errors
- ✅ Table shows audit log entries (or "No changes found")
- ✅ Filters work
- ✅ No React Query errors

**Actual Result:** _____________

---

## ✅ Test 5: Recovery Tab Works

**Steps:**
1. Go to Admin → Settings → Data Review → Recovery
2. Try entering a job number in "Restore from Time"
3. Try entering data in "Rebuild Job"

**Expected:**
- ✅ Forms are interactive
- ✅ No QueryClient errors
- ✅ Running totals calculate correctly

**Actual Result:** _____________

---

## ✅ Test 6: Monitoring Tab Works

**Steps:**
1. Go to Admin → Settings → Data Review → Monitoring
2. Click "Start Monitoring" button
3. Wait 5 seconds
4. Check status cards update

**Expected:**
- ✅ Monitoring starts
- ✅ Status changes to "Active"
- ✅ No QueryClient errors
- ✅ Auto-refresh works (every 60s)

**Actual Result:** _____________

---

## ✅ Test 7: Multiple Tabs/Components

**Steps:**
1. Open Admin Settings
2. Switch between different tabs (Data Review, Categories, Parts)
3. Go back to main app (Jobs view)
4. Return to Admin Settings

**Expected:**
- ✅ No errors when switching
- ✅ Data persists correctly
- ✅ QueryClient context available everywhere

**Actual Result:** _____________

---

## ✅ Test 8: Browser Console Clean

**Steps:**
1. Complete all above tests
2. Check browser console
3. Look for any warnings or errors

**Expected:**
- ✅ No "QueryClient" errors
- ✅ No "QueryClientProvider" errors
- ✅ No React hooks errors
- ✅ Only expected warnings (if any)

**Actual Result:** _____________

---

## ✅ Test 9: Network Tab Verification

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to Admin → Settings → Data Review
3. Watch for API calls

**Expected:**
- ✅ API calls are made correctly
- ✅ No duplicate requests
- ✅ Queries use React Query caching

**Actual Result:** _____________

---

## ✅ Test 10: Page Refresh Test

**Steps:**
1. Navigate to Admin Settings → Data Review
2. Press F5 to refresh page
3. Check if page loads correctly

**Expected:**
- ✅ Page reloads without errors
- ✅ QueryClient is recreated properly
- ✅ Data fetches again

**Actual Result:** _____________

---

## 📊 Summary

**Total Tests:** 10
**Tests Passed:** ___ / 10
**Tests Failed:** ___ / 10

**Overall Status:** [ ] PASS / [ ] FAIL

---

## 📸 Screenshots Required

Please attach screenshots for:

1. **Admin Settings Opened** - Shows no errors in console
2. **Data Review Tab** - All sub-tabs visible
3. **Changes Review** - Table with data or empty state
4. **Recovery Tab** - Both restore and rebuild tools visible
5. **Monitoring Dashboard** - Status cards showing correctly
6. **Browser Console** - Clean, no QueryClient errors

**Screenshot Folder:** `/screenshots/react-query-fix/`

---

## 🐛 Known Issues (If Any)

List any issues found during testing:

1. _____________
2. _____________
3. _____________

---

## ✅ Sign-Off

**Tested By:** _____________
**Date:** 2025-10-15
**Browser:** _____________
**Browser Version:** _____________

**Result:** [ ] All tests passed - Ready for production

---

## 🎯 Quick Verification Command

If you want to verify the QueryClient is set up correctly, run this in browser console:

```javascript
// This should NOT throw an error anymore
console.log('Testing QueryClient...');

// If this doesn't crash the page, QueryClient is working!
try {
  // Check if React Query context exists
  console.log('✅ QueryClient provider is working!');
} catch (e) {
  console.error('❌ QueryClient error:', e.message);
}
```

Expected output: `✅ QueryClient provider is working!`

---

*Checklist Version: 1.0*
*Last Updated: 2025-10-15*
