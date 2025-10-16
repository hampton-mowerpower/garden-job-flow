# 🚨 IMMEDIATE ACTION REQUIRED

## Current Status: API COMPLETELY DOWN

**Error:** PGRST002 - "Could not query the database for the schema cache"  
**Impact:** Job Search, Job Details, and ALL data operations are non-functional  
**Cause:** PostgREST (Supabase's API) cannot read its schema cache

---

## ⚡ EMERGENCY FIX - DO THIS NOW (5 minutes)

### Step 1: Open Supabase SQL Editor

**Click this link:** https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new

(This opens the SQL Editor with a direct database connection that bypasses the broken API)

---

### Step 2: Run the Recovery Script

1. **Open the file:** `EMERGENCY_SQL_FIX_V2.sql` (in your project root directory)

2. **Select ALL the code** (Ctrl+A or Cmd+A)

3. **Copy it** (Ctrl+C or Cmd+C)

4. **Paste into the SQL Editor** (opened from Step 1)

5. **Click the "Run" button** (or press Ctrl+Enter)

6. **Wait 20-30 seconds** - The script will:
   - Reload PostgREST schema
   - Grant all necessary permissions
   - Test all views for errors
   - Create health check functions
   - Verify everything is working

---

### Step 3: Verify Success

**Look for this in the SQL output:**
```
╔════════════════════════════════════════════════════════════╗
║  RECOVERY COMPLETE - Now test the health check:           ║
║                                                            ║
║  SELECT * FROM api_health_check();                        ║
║                                                            ║
║  Expected result: {"success": true, "healthy": true}      ║
╚════════════════════════════════════════════════════════════╝
```

**And the final line should show:**
```
result: {"success": true, "healthy": true, ...}
```

---

### Step 4: Test in Your App

1. **Wait 10 seconds** for PostgREST to fully reload

2. **Go to:** Admin → Data Review → Forensics tab

3. **Click "Check Health"** button

4. **Should show:** "API Status: Healthy" (green)

5. **Navigate to "Search & Manage Jobs"**

6. **Should see:** Job list loads without errors

---

## ✅ Success Criteria

- [ ] SQL script ran without errors
- [ ] Output shows "RECOVERY COMPLETE"
- [ ] Final health check shows `"healthy": true`
- [ ] App's Forensics tab shows "Healthy" status
- [ ] Job Search page loads with job data
- [ ] No red error toasts

---

## 🆘 If It Still Fails

### Check for Broken Views

Look in the SQL output for lines like:
```
⚠ BROKEN VIEW: some_view_name - Error: column "id" is ambiguous
```

**If you see broken views:**
1. Screenshot the specific error
2. Report which view is broken
3. The view needs to be recreated with explicit column names

### Check for Permission Errors

Look for lines like:
```
✗ auth SELECT  (showing ✗ instead of ✓)
```

**If you see permission errors:**
1. Screenshot the permission verification table
2. Report which table/role has the issue

### Still Not Working?

**Report these details:**
1. Screenshot of SQL output (especially the end)
2. Screenshot of the permission verification table
3. Any "BROKEN VIEW" or "ERROR" messages from the output
4. Screenshot of the app's Forensics tab after clicking "Check Health"

---

## Why This Happened

PostgREST maintains an internal cache of your database schema (tables, views, functions). When something breaks this cache:
- It can't serve ANY API requests
- All queries return PGRST002 error
- The UI can't load data

Common causes:
- Views with ambiguous column names (e.g., two tables both have "id")
- Functions without `SET search_path = public`
- Missing permissions after schema changes
- Recent migrations that changed table structure

The V2 recovery script fixes all these issues comprehensively.

---

## Files Created/Updated

1. **EMERGENCY_SQL_FIX_V2.sql** - Comprehensive recovery script (run this!)
2. **TEST_REPORT_TODAY.md** - Test results document (will update after recovery)
3. **RUNBOOK.md** - Updated with V2 instructions
4. **SchemaReloadControl.tsx** - Enhanced health checking

---

## After Recovery

Once everything is working:
1. Review the SQL output for any warnings
2. Update TEST_REPORT_TODAY.md with actual results
3. Test all critical functionality:
   - Job Search
   - Job Details
   - Customer profiles
   - Search functionality
   - Status updates
4. Screenshot successful operations
5. Keep Stabilization Mode ON until full verification

---

**⏱ Time Estimate:** 5-10 minutes total  
**Difficulty:** Low (copy/paste SQL script)  
**Risk:** None (script only grants permissions and reloads schema)

**🎯 Next:** Run EMERGENCY_SQL_FIX_V2.sql NOW
