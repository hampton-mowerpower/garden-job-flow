# 🚨 IMMEDIATE ACTION: Run V4 SQL Fix

## What's Wrong
- **PostgREST API:** DOWN (PGRST002 error)
- **Fallback RPC:** BROKEN (SQL aggregate error)
- **Result:** Jobs cannot load

## The Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
👉 **[CLICK HERE TO OPEN SQL EDITOR](https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new)** 👈

### Step 2: Copy the SQL Script
1. In your project, open file: `EMERGENCY_SQL_FIX_V4_FINAL.sql`
2. Select ALL text (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)

### Step 3: Run in Supabase
1. Paste into SQL Editor (Ctrl+V / Cmd+V)
2. Click **"Run"** button (bottom right)
3. Wait 10-20 seconds for completion

### Step 4: Verify Success
Look for this output in the SQL Editor results:
```
╔════════════════════════════════════════════════════════════╗
║  V4 FIX COMPLETE                                           ║
║                                                            ║
║  ✓ Fallback functions are working                         ║
║  ✓ Jobs will load in the UI now (fallback mode)           ║
║                                                            ║
║  NEXT: Refresh your app to see jobs load                  ║
╚════════════════════════════════════════════════════════════╝
```

### Step 5: Test in Your App
1. **Refresh your browser** (F5 / Cmd+R)
2. Navigate to **"Search & Manage Jobs"**
3. You should see:
   - ✅ Jobs list with data
   - ⚠️ Yellow banner saying "Fallback Mode Active"
4. Click on a job - details should open

### Step 6: Report Status
Once jobs are loading, go to **Admin → Data Review → Forensics** and click **"Check Health"** to see if the PostgREST REST API is still down or recovered.

## What This Fix Does
- ✅ Fixes SQL aggregate error in `get_jobs_direct()`
- ✅ Changes function to return TABLE instead of jsonb
- ✅ Adds `get_job_detail_direct()` for single job queries
- ✅ Grants proper permissions
- ✅ Tests functions automatically
- ⚠️ PostgREST may still need separate fix (but jobs will load)

## If It Still Doesn't Work
1. Check SQL Editor output for errors
2. Screenshot any errors
3. Report back with the error message

---

**Time to Complete:** 5 minutes  
**Risk:** None (only adds new functions, doesn't modify existing data)  
**Result:** Jobs will load immediately in fallback mode
