# Hampton Mowerpower System Runbook

## 🚨 CRITICAL: "Database API Connection Lost" Error

### Symptoms
- Red toast: "Database API Connection Lost"
- Job Search shows "No jobs created yet" when jobs exist
- Console error: `PGRST002: Could not query the database for the schema cache`
- All API requests return 503 status

### Root Cause
PostgREST (Supabase's API layer) cannot read its internal schema cache table. This happens after:
- Database migrations that change table structure
- Views created with ambiguous column names
- Missing permissions after adding new tables
- Schema changes without reloading PostgREST

### ⚡ IMMEDIATE FIX (5 minutes)

1. **Open Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/sql/new

2. **Run the emergency SQL file**
   - Copy ALL commands from `EMERGENCY_SQL_FIX.sql` in your project root
   - Paste into SQL Editor
   - Click "Run"
   - Check output for any errors

3. **Wait 10 seconds**
   - PostgREST automatically reloads when it receives the pg_notify

4. **Verify the fix**
   - In your app: Admin → Data Review → Forensics
   - Click "Check Health"
   - Should show green "Healthy" status
   - Go to Job Search - should load jobs

### Prevention Steps

**After EVERY database migration:**
```sql
-- Always run this after schema changes
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
```

**When creating views:**
```sql
-- ❌ BAD: Ambiguous columns
CREATE VIEW jobs_view AS
SELECT * FROM jobs j
JOIN customers c ON j.customer_id = c.id;

-- ✅ GOOD: Explicit column aliases
CREATE VIEW jobs_view AS
SELECT 
  j.id as job_id,
  j.job_number,
  c.id as customer_id,
  c.name as customer_name
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id;
```

**Grant permissions immediately:**
```sql
-- After creating any new table
GRANT SELECT ON new_table TO anon, authenticated;
```

---

## 🔧 Common Issues & Fixes

### Issue: Job Status Update Fails

**Symptoms:**
- Error toast when changing status
- Status reverts to old value
- Console error: "Version mismatch" or "Conflict"

**Fix:**
```typescript
// The UI should already handle this, but if it doesn't:
// 1. Refresh the page to get latest version number
// 2. Try status update again
// 3. If still fails, check database directly:

SELECT job_number, status, version 
FROM jobs_db 
WHERE job_number = 'JB2025-0061';

// If version is stuck, reset it:
UPDATE jobs_db 
SET version = version + 1 
WHERE job_number = 'JB2025-0061';
```

### Issue: Jobs Show in Search but Not Customer Profile

**Symptoms:**
- Job appears in Job Search
- Same job missing from Customer → Jobs tab
- Job counts don't match

**Fix:**
```typescript
// Clear React Query cache
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries(['jobs']);
queryClient.invalidateQueries(['customers']);

// Or just refresh the page
```

**Verify data integrity:**
```sql
-- Check the job's customer link
SELECT 
  j.job_number,
  j.customer_id,
  c.name as customer_name,
  c.phone
FROM jobs_db j
LEFT JOIN customers_db c ON c.id = j.customer_id
WHERE j.job_number = 'JB2025-0061';

-- Should return the correct customer
-- If customer_id is NULL or wrong, fix it:
UPDATE jobs_db
SET customer_id = (SELECT id FROM customers_db WHERE phone = '0422408306')
WHERE job_number = 'JB2025-0061';
```

### Issue: Duplicate Triggers Causing Conflicts

**Symptoms:**
- Same trigger fires twice
- Version number jumps by 2 instead of 1
- Audit log has duplicate entries

**Find duplicates:**
```sql
SELECT 
  trigger_name,
  event_object_table,
  COUNT(*) as occurrences
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY trigger_name, event_object_table
HAVING COUNT(*) > 1;
```

**Fix:**
```sql
-- Drop all instances of the trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;

-- Recreate it once
CREATE TRIGGER trigger_name
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION trigger_function();
```

---

## 🔍 Daily Health Check

Run this every morning:

### 1. System Doctor Check
- Navigate to: Admin → Data Review → Forensics
- Click "Run All Checks"
- All should be green ✅
- If any are red ❌, investigate immediately

### 2. Performance Check
- Go to: Admin → Monitoring (if implemented)
- Verify:
  - Error rate < 1%
  - Response time < 500ms
  - No critical alerts

### 3. Data Integrity Spot Check
```sql
-- Random sample of jobs should all have valid customers
SELECT 
  j.job_number,
  j.customer_id,
  c.name as customer_name
FROM jobs_db j
LEFT JOIN customers_db c ON c.id = j.customer_id
WHERE j.deleted_at IS NULL
ORDER BY RANDOM()
LIMIT 10;

-- All should have customer_name populated
-- If any NULL, investigate
```

### 4. Backup Verification
```bash
# Check last backup completed
# (Add your backup verification command)
```

---

## 🆘 Emergency Rollback Procedure

### When to Rollback
- Critical functionality is broken
- Multiple users affected
- Data integrity compromised
- Fix is not working after 30 minutes

### Steps

1. **Enable Stabilization Mode (if exists)**
```sql
UPDATE feature_flags 
SET enabled = true 
WHERE name = 'stabilization_mode';
```

2. **Identify Last Working State**
```sql
-- View recent migrations
SELECT * FROM schema_migrations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check when issues started in audit log
SELECT * FROM audit_log 
WHERE changed_at > NOW() - INTERVAL '2 hours'
ORDER BY changed_at DESC;
```

3. **Take Backup Before Rollback**
```bash
# Replace with your actual credentials
pg_dump -h [host] -U [user] -d [database] \
  > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
```

4. **Rollback Database Changes**
```bash
# If using migrations
npm run migrate:rollback

# Test if system works
# If still broken, rollback another
npm run migrate:rollback
```

5. **Document the Incident**
Create file: `INCIDENT_REPORT_[DATE].md`
```markdown
# Incident Report

## Date: [DATE]
## Severity: [CRITICAL/HIGH/MEDIUM]

### What Broke
[Description of the issue]

### Root Cause
[What caused it]

### Impact
- Users affected: [number]
- Duration: [time]
- Data lost: [yes/no, description]

### Fix Applied
[What was done to fix it]

### What Was Rolled Back
- Migration: [name/timestamp]
- Features disabled: [list]
- Code reverted: [commit hash]

### Prevention
[How to prevent this in future]
```

6. **Notify Users**
- Post in system status channel
- Email affected users if necessary
- Update status page

---

## 📊 Monitoring & Alerts

### Critical Alerts (Immediate Action)
- API down (all requests failing)
- Error rate > 10%
- Response time > 5 seconds
- Database connection lost

### Warning Alerts (Investigate Soon)
- Error rate > 5%
- Response time > 2 seconds
- Disk space < 20%
- Slow queries detected

### How to Investigate

**Check Logs:**
```bash
# Application logs
tail -f /var/log/app.log | grep ERROR

# Database logs (Supabase Dashboard)
# Navigate to: Logs → Postgres
# Filter by: error_severity = ERROR
```

**Check Network:**
```bash
# Test API endpoint
curl -v https://kyiuojjaownbvouffqbm.supabase.co/rest/v1/jobs_db?limit=1

# Should return 200 OK with JSON data
# If 503, schema cache issue
# If 401, auth issue  
# If 404, routing issue
```

---

## 🎯 Known Issues & Workarounds

### Issue: Schema Cache Occasionally Goes Stale
**Frequency:** After major migrations  
**Workaround:** Run reload schema command  
**Permanent Fix:** Automate reload after migrations

### Issue: Optimistic Locking Conflicts During Busy Hours
**Frequency:** When multiple users edit same job  
**Workaround:** Retry the update  
**Permanent Fix:** Implement conflict resolution UI

### Issue: Search Doesn't Find Recent Jobs Immediately
**Frequency:** Within 30 seconds of job creation  
**Workaround:** Refresh the page  
**Permanent Fix:** Invalidate query cache on create

---

## 📚 Useful SQL Queries

### Find Jobs With Issues
```sql
-- Jobs with no customer
SELECT job_number, customer_id 
FROM jobs_db 
WHERE customer_id IS NULL 
  AND deleted_at IS NULL;

-- Jobs with deleted customer
SELECT j.job_number, j.customer_id 
FROM jobs_db j
LEFT JOIN customers_db c ON c.id = j.customer_id
WHERE c.is_deleted = true 
  AND j.deleted_at IS NULL;

-- Jobs with mismatched totals
SELECT 
  job_number,
  grand_total,
  balance_due,
  service_deposit
FROM jobs_db
WHERE grand_total - service_deposit != balance_due
  AND deleted_at IS NULL;
```

### Audit Recent Changes
```sql
-- Last 24 hours of changes
SELECT 
  table_name,
  operation,
  record_id,
  changed_by,
  changed_at,
  array_length(changed_fields, 1) as fields_changed
FROM audit_log
WHERE changed_at > NOW() - INTERVAL '24 hours'
ORDER BY changed_at DESC
LIMIT 50;

-- Changes to specific job
SELECT * FROM audit_log
WHERE table_name = 'jobs_db'
  AND record_id = '[job_id]'
ORDER BY changed_at DESC;
```

### Check System Health
```sql
-- Database connections
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = current_database();

-- Slow queries (if you have pg_stat_statements)
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔐 Security Checklist

### Before Deploying Changes
- [ ] RLS policies reviewed
- [ ] No sensitive data in logs
- [ ] API keys not in code
- [ ] Permissions follow least privilege
- [ ] Audit logging enabled
- [ ] Backup taken
- [ ] Tested in staging
- [ ] Rollback plan ready

### After Major Changes
- [ ] Schema reload completed
- [ ] Permissions verified
- [ ] Health checks passing
- [ ] No errors in logs
- [ ] Data integrity verified
- [ ] Users can access their data
- [ ] Admin can access admin features
- [ ] Backup successful

---

## 📞 Escalation Path

1. **Level 1: System Doctor** (Self-service)
   - Run automated health checks
   - Follow this runbook
   - Check logs and metrics

2. **Level 2: Manual SQL** (Technical admin)
   - Run emergency SQL scripts
   - Review database directly
   - Check Supabase dashboard

3. **Level 3: Code Rollback** (Developer)
   - Revert recent changes
   - Restore from backup
   - Contact Supabase support

4. **Level 4: Full Outage** (Emergency)
   - Enable maintenance mode
   - Full system restore from backup
   - Post-mortem required

---

## ✅ Success Criteria

System is considered "healthy" when ALL of these are true:

- [ ] Job Search loads without errors
- [ ] Job Details page opens completely
- [ ] Customer → Jobs tab shows data
- [ ] Search finds jobs by number/name/phone
- [ ] Status updates save successfully
- [ ] System Doctor shows all green
- [ ] No console errors
- [ ] Response time < 500ms
- [ ] Error rate < 1%
- [ ] All health checks passing

**If any fail: INVESTIGATE IMMEDIATELY**
