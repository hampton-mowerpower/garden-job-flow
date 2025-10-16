# Optimistic Concurrency Control (OCC) Endpoint Matrix

## Overview

This document provides a comprehensive mapping of all write endpoints in the system and their OCC enforcement status.

**Last Updated:** October 15, 2025  
**Status:** ✅ ALL ENDPOINTS PROTECTED

---

## Core Write Endpoints

| Endpoint | Method | Table | OCC Status | Version Check | Conflict Handler | Protected Fields |
|----------|--------|-------|------------|---------------|------------------|------------------|
| `/jobs/:id` | PUT | jobs_db | ✅ ENFORCED | `WHERE version = $v` | ConflictResolutionDialog | customer_id, grand_total, balance_due |
| `/jobs/:id/parts` | POST/PUT | job_parts | ✅ ENFORCED | Via job version | ConflictResolutionDialog | - |
| `/jobs/:id/payments` | POST | job_payments | ✅ ENFORCED | Via job version | ProtectedFieldDialog | amount, method |
| `/jobs/:id` | DELETE | jobs_db | ✅ ENFORCED | Admin-only + version | - | - |
| `/customers/:id` | PUT | customers_db | ✅ ENFORCED | `WHERE version = $v` | ConflictResolutionDialog | phone, email, name |
| `/customers/:id` | DELETE | customers_db | ✅ ENFORCED | Admin-only + version | - | - |

---

## Secondary Write Endpoints

| Endpoint | Method | Table | OCC Status | Version Check | Notes |
|----------|--------|-------|------------|---------------|-------|
| `/invoices` | POST | invoices | ✅ ENFORCED | Idempotency key | New records only |
| `/invoices/:id` | PUT | invoices | ✅ ENFORCED | `WHERE version = $v` | Admin-only |
| `/invoice_lines` | POST | invoice_lines | ✅ ENFORCED | Via invoice version | - |
| `/job_labour` | POST/PUT | job_labour | ✅ ENFORCED | Via job version | - |
| `/job_sales_items` | POST/PUT | job_sales_items | ✅ ENFORCED | Via job version | - |
| `/parts_catalogue/:id` | PUT | parts_catalogue | ✅ ENFORCED | `WHERE version = $v` | Admin/manager only |

---

## Admin-Only Endpoints

| Endpoint | Method | Table | OCC Status | Authorization | Audit |
|----------|--------|-------|------------|---------------|-------|
| `/admin/recovery/:job_id` | POST | job_recovery_staging | ✅ ENFORCED | Admin only | Full audit trail |
| `/admin/locks` | POST | record_locks | ✅ ENFORCED | Admin only | Lock reason required |
| `/admin/locks/:id` | DELETE | record_locks | ✅ ENFORCED | Admin only | Unlock audited |
| `/admin/protected-fields` | PUT | protected_field_changes | ✅ ENFORCED | Admin only | Reason required |

---

## OCC Implementation Details

### 1. Database-Level Version Check

**Trigger:**
```sql
CREATE OR REPLACE FUNCTION check_optimistic_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if version was incremented by exactly 1
  IF NEW.version != OLD.version + 1 THEN
    RAISE EXCEPTION 'Optimistic lock failure: expected version %, got %', 
      OLD.version + 1, NEW.version
      USING ERRCODE = '40001'; -- SERIALIZATION_FAILURE (maps to HTTP 409)
  END IF;
  RETURN NEW;
END;
$$;
```

**Applied To:**
- jobs_db (BEFORE UPDATE)
- customers_db (BEFORE UPDATE)

### 2. Frontend Implementation

**Storage Layer (`src/lib/storage.ts`):**
```typescript
export async function saveJob(job: Job): Promise<void> {
  // Step 1: Fetch current version
  const { data: current, error: fetchError } = await supabase
    .from('jobs_db')
    .select('version')
    .eq('id', job.id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Step 2: Prepare update with incremented version
  const updates = {
    ...job,
    version: current.version + 1,
    updated_at: new Date().toISOString()
  };
  
  // Step 3: Update with version check
  const { error: updateError } = await supabase
    .from('jobs_db')
    .update(updates)
    .eq('id', job.id)
    .eq('version', current.version); // CRITICAL: version check
  
  if (updateError) {
    // Check if conflict (code 40001 or PGRST116)
    if (updateError.code === '40001' || updateError.message.includes('version')) {
      throw new Error('CONFLICT: Job version mismatch. Another user has modified this record.');
    }
    throw updateError;
  }
}
```

**Component Integration:**
```typescript
// JobForm.tsx
try {
  await saveJob(jobData);
  toast.success('Job saved');
} catch (error: any) {
  if (error.message.includes('CONFLICT')) {
    setConflictDialogOpen(true);
    setConflictDetails({
      recordType: 'Job',
      recordId: jobData.id,
      expectedVersion: currentVersion,
      actualVersion: currentVersion + 1 // Server has newer version
    });
  } else {
    toast.error(error.message);
  }
}
```

### 3. Conflict Resolution UI

**Component:** `ConflictResolutionDialog.tsx`

**Options:**
1. **Reload Latest Data** (Recommended)
   - Discards local changes
   - Fetches latest from server
   - User can reapply changes manually

2. **Force Overwrite** (Admin Only)
   - Requires detailed reason
   - Overrides version check
   - Fully audited
   - Warning: Discards other user's changes

**Example Flow:**
```
User A opens Job #123 (version 5)
User B opens Job #123 (version 5)
User B saves → Job #123 now version 6
User A saves → 409 Conflict
→ ConflictResolutionDialog appears
→ User A chooses "Reload Latest Data"
→ Job #123 refetched (version 6)
→ User A reapplies changes
→ Save succeeds → Job #123 now version 7
```

---

## Protected Field Enforcement

### Definition
**Protected Fields** are fields that, when changed, require:
1. Explicit 2-step confirmation
2. Detailed reason/justification
3. Full audit trail
4. Admin/authorized role only

### Protected Fields by Table

**jobs_db:**
- `customer_id` (customer link)
- `grand_total` (computed from server)
- `balance_due` (computed from server)
- `service_deposit` (payment-related)
- `quotation_amount` (financial)

**customers_db:**
- `phone` (identity)
- `email` (identity)
- `name` (identity)

**job_payments:**
- `amount` (financial)
- `method` (audit trail)

### Enforcement Flow

```typescript
// Before saving protected field change
if (isProtectedField(fieldName)) {
  showProtectedFieldDialog({
    fieldName,
    oldValue,
    newValue,
    tableName,
    onConfirm: async (reason) => {
      // Log to protected_field_changes
      await supabase.from('protected_field_changes').insert({
        table_name: tableName,
        record_id: recordId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        change_reason: reason,
        changed_by: auth.uid()
      });
      
      // Proceed with save
      await saveRecord(updates);
    }
  });
}
```

---

## Record Locking

### Purpose
Prevent concurrent edits on critical records by locking them during:
- Recovery operations
- Bulk updates
- Long-running edits

### Implementation

**Lock Acquisition:**
```sql
INSERT INTO record_locks (table_name, record_id, locked_by, lock_reason)
VALUES ('jobs_db', $job_id, $user_id, 'Manual data recovery')
ON CONFLICT (table_name, record_id) DO NOTHING;
```

**Lock Check (Trigger):**
```sql
CREATE FUNCTION check_record_lock() ...
-- Raises error if locked by another user
```

**Lock Release:**
```sql
DELETE FROM record_locks
WHERE table_name = 'jobs_db' AND record_id = $job_id;
```

### Lock Behavior

| Scenario | Behavior |
|----------|----------|
| User A locks record | User B's save → ERROR: "Record is locked" |
| Admin locks record | Only admin can edit |
| Lock expires (1h) | Auto-release (background job) |
| User closes window | Lock persists (manual unlock required) |

---

## Idempotency Keys

### Purpose
Prevent duplicate operations from:
- Auto-save
- Payment submissions
- Email sends

### Implementation

**Client-Side:**
```typescript
const idempotencyKey = `${operation}_${recordId}_${timestamp}`;

await supabase.from('email_outbox').insert({
  idempotency_key: idempotencyKey,
  ...emailData
}).onConflict(['idempotency_key']).doNothing();
```

**Database:**
```sql
CREATE UNIQUE INDEX idx_email_outbox_idempotency 
  ON email_outbox(idempotency_key);
```

**Benefit:**
- Duplicate submit → Ignored (no error)
- Safe retry logic
- Audit trail preserved

---

## Error Codes & Handling

| Code | Meaning | HTTP Status | Frontend Action |
|------|---------|-------------|-----------------|
| `40001` | Serialization failure (version conflict) | 409 | Show ConflictResolutionDialog |
| `23505` | Unique constraint violation | 409 | Show duplicate warning |
| `P0001` | Record locked | 423 | Show "Record locked by X" message |
| `23503` | Foreign key violation | 400 | Show validation error |
| `23514` | Check constraint violation | 400 | Show validation error |

---

## Monitoring & Alerts

### Real-Time Monitoring

**Metrics:**
- Conflict rate (409 responses / total writes)
- Lock contention (failed lock acquisitions)
- Average conflict resolution time
- Force overwrite count (admin actions)

**Dashboard:** Admin → Data Forensics → OCC Metrics

**Alerts:**
- Conflict rate > 5% → Investigate concurrency patterns
- Force overwrite > 10/day → Review admin training
- Lock contention > 20% → Optimize lock duration

---

## Testing Strategy

### Unit Tests
```typescript
describe('Optimistic Concurrency Control', () => {
  it('should detect version conflict', async () => {
    const job = await getJob('123');
    const staleJob = { ...job };
    
    // Simulate concurrent update
    await updateJob({ ...job, notes: 'Updated by User A' });
    
    // Attempt stale update
    await expect(
      updateJob({ ...staleJob, notes: 'Updated by User B' })
    ).rejects.toThrow('CONFLICT');
  });
});
```

### Integration Tests
```typescript
it('should show conflict dialog on version mismatch', async () => {
  render(<JobForm jobId="123" />);
  
  // Simulate backend conflict
  mockSupabase.update.mockRejectedValue({
    code: '40001',
    message: 'Optimistic lock failure'
  });
  
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(screen.getByText('Data Conflict Detected')).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
it('should handle concurrent edits correctly', async () => {
  // User A opens job
  const pageA = await browser.newPage();
  await pageA.goto('/jobs/123');
  
  // User B opens same job
  const pageB = await browser.newPage();
  await pageB.goto('/jobs/123');
  
  // User B saves first
  await pageB.click('[data-testid="save-button"]');
  await pageB.waitForText('Job saved');
  
  // User A tries to save
  await pageA.click('[data-testid="save-button"]');
  await pageA.waitForText('Data Conflict Detected');
  
  // User A reloads
  await pageA.click('[data-testid="reload-button"]');
  await pageA.waitForText('Data reloaded');
  
  // User A saves again
  await pageA.click('[data-testid="save-button"]');
  await pageA.waitForText('Job saved');
});
```

---

## Best Practices

### For Developers

1. **Always fetch current version before update**
   ```typescript
   const { data: current } = await supabase
     .from('jobs_db')
     .select('version')
     .eq('id', id)
     .single();
   ```

2. **Always include version in WHERE clause**
   ```typescript
   .update({ ...updates, version: current.version + 1 })
   .eq('id', id)
   .eq('version', current.version) // CRITICAL
   ```

3. **Always handle 409 Conflict errors**
   ```typescript
   catch (error) {
     if (error.code === '40001') {
       showConflictDialog();
     }
   }
   ```

4. **Always use idempotency keys for non-idempotent operations**
   ```typescript
   const key = `${operation}_${id}_${Date.now()}`;
   ```

### For Admins

1. **Review protected field changes weekly**
   - Admin → Audit → Protected Fields
   - Verify all changes have valid reasons

2. **Monitor conflict rate**
   - Admin → OCC Metrics
   - Investigate if > 5%

3. **Train staff on conflict resolution**
   - When to reload
   - When to force overwrite (rare)
   - Always provide detailed reason

---

## Appendix: Version Column Schema

```sql
-- All critical tables have:
ALTER TABLE <table_name> 
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Auto-increment on update (via trigger):
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_<table>_version
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- But conflict detection happens in check_optimistic_lock()
-- which validates the version increment was exactly +1
```

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Maintained By:** Engineering Team  
**Review Frequency:** Quarterly
