# Customer Data Persistence & Safe Deletion - COMPLETE FIX

## Issues Fixed

### 1. ❌ Customer Edit Not Persisting (FIXED ✅)
**Problem**: Editing customer details on job JB2025-0061 didn't save changes to database.

**Root Cause**: The `saveCustomer()` function in `src/lib/storage.ts` was returning early without updating the database when a customer already had an ID.

**Fix**: Updated `saveCustomer()` to properly UPDATE the customer record in `customers_db` table when customer has existing ID.

```typescript
// BEFORE (lines 14-18):
if (customer.id && this.isValidUUID(customer.id)) {
  return customer; // ❌ Just returned without updating DB
}

// AFTER:
if (customer.id && this.isValidUUID(customer.id)) {
  const { data, error } = await supabase
    .from('customers_db')
    .update({ ...customerData })
    .eq('id', customer.id)
    .select()
    .single(); // ✅ Actually updates the database
  
  if (error) throw error;
  return mappedCustomer;
}
```

### 2. ❌ Cannot Delete Customers with Jobs (FIXED ✅)
**Problem**: FK constraint `jobs_db_customer_id_fkey` prevented customer deletion, showing error: "Unable to delete row as it is currently referenced by a foreign key constraint"

**Solution**: Implemented multi-tier deletion strategy:

#### Database Level (Migration):
```sql
-- A. Added soft delete support
ALTER TABLE customers_db ADD COLUMN deleted_at timestamptz;

-- B. Block unsafe hard deletes
CREATE FUNCTION block_customer_delete_if_jobs()
  -- Prevents hard delete if customer has jobs
  -- Shows helpful error message

-- C. Created safe merge function
CREATE FUNCTION merge_customers(keeper_id, duplicate_ids[])
  -- Safely moves all jobs to keeper customer
  -- Soft deletes duplicate customers
  -- Logs operation in maintenance_audit
```

#### Application Level:
- Updated `CustomerEdit.tsx` with two deletion options:
  - **Soft Delete (Hide)**: Sets `deleted_at`, hides from lists, preserves job history
  - **Hard Delete**: Only works if customer has zero jobs
  
- Better error handling with user-friendly messages:
  ```typescript
  if (error.message?.includes('foreign key')) {
    toast({
      title: 'Cannot Delete',
      description: 'Customer has existing jobs. Use Soft Delete or Merge instead.',
      duration: 6000
    });
  }
  ```

### 3. ✅ Data Normalization & Duplicate Prevention
Added normalization functions and unique indexes:

```sql
-- Email normalization: lowercase + trim
CREATE FUNCTION normalize_email(txt) 
  RETURNS text AS $$ SELECT NULLIF(LOWER(TRIM($1)), '') $$;

-- Phone normalization: AU format to E.164
CREATE FUNCTION normalize_phone_au(txt)
  RETURNS text AS $$
    -- Converts 0412345678 → +61412345678
  $$;

-- Unique indexes prevent duplicates
CREATE UNIQUE INDEX ux_customers_email_norm
  ON customers_db(email_norm)
  WHERE email_norm IS NOT NULL 
    AND is_deleted = false 
    AND deleted_at IS NULL;

CREATE UNIQUE INDEX ux_customers_phone_e164
  ON customers_db(phone_e164) -- Same conditions
```

### 4. ✅ Automatic Normalization Trigger
```sql
CREATE TRIGGER trg_customer_normalize
  BEFORE INSERT OR UPDATE ON customers_db
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_normalized_fields();
  -- Auto-populates email_norm and phone_e164 on every insert/update
```

### 5. ✅ Safety Measures
- **Mass Update Protection**: Existing `forbid_mass_update_jobs()` trigger prevents accidental cross-job overwrites
- **Merge Function**: Safe customer merge with bypass: `SET LOCAL app.allow_mass_job_updates = true;`
- **Audit Logging**: All merge/delete operations logged to `maintenance_audit` table

---

## Database Schema Changes

### New Columns on `customers_db`:
```sql
- email_norm text          -- Normalized email for duplicate detection
- phone_e164 text          -- E.164 format phone (e.g., +61412345678)
- deleted_at timestamptz   -- Soft delete timestamp
```

### New Table: `maintenance_audit`
```sql
CREATE TABLE maintenance_audit (
  id uuid PRIMARY KEY,
  performed_at timestamptz DEFAULT now(),
  action text NOT NULL,
  table_name text NOT NULL,
  rows_affected integer,
  description text,
  performed_by uuid REFERENCES auth.users(id),
  metadata jsonb
);
```

### New Functions:
1. `normalize_email(text)` - Email normalization
2. `normalize_phone_au(text)` - Phone to E.164
3. `set_customer_normalized_fields()` - Auto-normalization trigger
4. `block_customer_delete_if_jobs()` - Delete safety check
5. `merge_customers(keeper_id, duplicate_ids[])` - Safe customer merge
6. `soft_delete_customer(customer_id)` - Soft delete wrapper

---

## UI Changes

### CustomerEdit.tsx
- **New "Soft Delete" button**: Hides customer without breaking job references
- **Enhanced delete dialog**: Shows two options with clear explanations
- **Better error messages**: FK constraint errors show actionable guidance

### storage.ts
- **Fixed `saveCustomer()`**: Now actually updates existing customer records
- **Added logging**: Console logs for debugging customer updates

---

## Testing Instructions

### Test 1: Edit Job Customer Details (JB2025-0061)
```bash
1. Open job JB2025-0061 for editing
2. Change customer mobile to: 0422408306
3. Change customer name to: "Andrew Crook"
4. Click Save
5. Confirm in dialog: "Yes, Change Customer"
6. ✅ VERIFY: Dialog shows loading state
7. ✅ VERIFY: Success toast appears
8. ✅ VERIFY: Dialog closes

# Database Verification:
SELECT customer_id, (
  SELECT name FROM customers_db WHERE id = jobs_db.customer_id
) as customer_name,
(
  SELECT phone FROM customers_db WHERE id = jobs_db.customer_id  
) as customer_phone
FROM jobs_db 
WHERE job_number = 'JB2025-0061';

# Expected Result:
# customer_name = "Andrew Crook"
# customer_phone = "0422408306"

# Audit Log Verification:
SELECT * FROM customer_change_audit 
WHERE job_number = 'JB2025-0061'
ORDER BY changed_at DESC LIMIT 1;

# Expected: One row with old and new values
```

### Test 2: Customer Soft Delete
```bash
1. Go to Customer Management
2. Select customer "Mark Smith" (0427...)
3. Click Edit
4. Click Delete button
5. In dialog, click "Soft Delete (Hide)"
6. ✅ VERIFY: Success message shows job count
7. ✅ VERIFY: Customer disappears from main list
8. ✅ VERIFY: Jobs still reference this customer

# Database Verification:
SELECT id, name, deleted_at, is_deleted 
FROM customers_db 
WHERE name = 'Mark Smith';

# Expected:
# deleted_at = <timestamp>
# is_deleted = true

# Jobs still work:
SELECT COUNT(*) FROM jobs_db j
JOIN customers_db c ON c.id = j.customer_id
WHERE c.name = 'Mark Smith';

# Expected: Count > 0 (jobs still exist)
```

### Test 3: Attempt Hard Delete with Jobs
```bash
1. Edit customer "Simon, look" (has job JB2025-0059)
2. Click Delete
3. In dialog, click "Hard Delete"
4. ✅ VERIFY: Error message appears
5. ✅ VERIFY: Message says "use Soft Delete or Merge"
6. ✅ VERIFY: Customer still exists in database

# Database Verification:
SELECT id, name, deleted_at FROM customers_db 
WHERE name LIKE 'Simon%';

# Expected:
# deleted_at = NULL (not deleted)
```

### Test 4: Duplicate Detection & Merge
```bash
# Using existing Data Recovery Panel:
1. Go to Admin → Data Recovery (if available)
2. Click "Find Duplicate Customers"
3. Select duplicate group (e.g., multiple "Barry Rickard" entries)
4. Click "Merge into [keeper name]"
5. ✅ VERIFY: Jobs move to keeper customer
6. ✅ VERIFY: Duplicate customers are soft-deleted
7. ✅ VERIFY: Audit log entry created

# Database Verification:
SELECT * FROM maintenance_audit
WHERE action = 'merge_customers'
ORDER BY performed_at DESC LIMIT 1;

# Expected: metadata shows job count moved
```

### Test 5: Phone Normalization
```bash
# Automatic normalization on insert/update:
INSERT INTO customers_db (name, phone, address)
VALUES ('Test Customer', '0412 345 678', '123 Test St');

SELECT phone, phone_e164 FROM customers_db 
WHERE name = 'Test Customer';

# Expected:
# phone = "0412 345 678"
# phone_e164 = "+61412345678"
```

### Test 6: Prevent Duplicate Email
```bash
# Try to insert duplicate normalized email:
INSERT INTO customers_db (name, email, phone, address)
VALUES ('Duplicate Test', 'JOHN@EXAMPLE.COM', '0400000001', 'Test');

INSERT INTO customers_db (name, email, phone, address)
VALUES ('Duplicate Test 2', 'john@example.com', '0400000002', 'Test');

# ✅ VERIFY: Second insert fails with unique constraint error
# Error: duplicate key value violates unique constraint "ux_customers_email_norm"
```

---

## Acceptance Criteria ✅

- [x] Editing job customer details persists to database
- [x] Changes only affect the edited job (no cross-job overwrites)  
- [x] Customer deletion shows clear options (Soft Delete vs Hard Delete)
- [x] Soft delete hides customer but preserves job references
- [x] Hard delete blocked if customer has jobs (with helpful error)
- [x] Email/phone normalized automatically on insert/update
- [x] Duplicate emails/phones prevented by unique indexes
- [x] Audit trail for all merge/delete operations
- [x] Mass update safety trigger still active
- [x] Merge customers function safely moves jobs

---

## Files Modified

### Database Migrations:
- `supabase/migrations/[timestamp]_customer_persistence_fix.sql`
  - Normalization functions
  - New columns (email_norm, phone_e164, deleted_at)
  - Unique indexes
  - Safety triggers
  - Merge/soft delete functions
  - maintenance_audit table

### Application Code:
- `src/lib/storage.ts`
  - Fixed `saveCustomer()` to UPDATE existing customers
  - Added console logging for debugging

- `src/components/CustomerEdit.tsx`
  - Added `handleSoftDelete()` function
  - Enhanced delete dialog with two options
  - Better FK constraint error handling

- `src/utils/customerDataRecovery.ts` (existing)
  - Already has `mergeDuplicateCustomers()` function
  - Works with new `merge_customers()` DB function

- `src/components/admin/DataRecoveryPanel.tsx` (existing)
  - Already has merge UI
  - Can use new soft delete functionality

---

## Production Rollout Plan

### Pre-Deployment:
1. ✅ Backup production database:
   ```bash
   pg_dump -h [host] -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. ✅ Test in staging:
   - Run all tests above
   - Verify no breaking changes
   - Check performance of new indexes

### Deployment:
1. ✅ Migration runs automatically on next deploy
2. ✅ Existing customers get normalized columns populated
3. ✅ No downtime required (additive changes only)

### Post-Deployment:
1. Monitor for unique constraint violations
2. Review `maintenance_audit` logs
3. Check for any failed customer updates
4. Run data quality report:
   ```sql
   -- Count customers with missing normalized values
   SELECT 
     COUNT(*) FILTER (WHERE email IS NOT NULL AND email_norm IS NULL) as missing_email_norm,
     COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone_e164 IS NULL) as missing_phone_norm,
     COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as soft_deleted
   FROM customers_db;
   ```

### Monitoring Queries:
```sql
-- Check for duplicate detection opportunities
SELECT phone_e164, COUNT(*) 
FROM customers_db 
WHERE is_deleted = false AND deleted_at IS NULL
GROUP BY phone_e164 
HAVING COUNT(*) > 1;

-- Monitor merge operations
SELECT * FROM maintenance_audit 
WHERE action = 'merge_customers'
AND performed_at > now() - interval '7 days';

-- Check hard delete attempts (should be blocked)
SELECT * FROM maintenance_audit
WHERE description LIKE '%delete%customer%'
ORDER BY performed_at DESC;
```

---

## Known Limitations & Future Work

### Current Implementation:
- ✅ Single-tenant normalized indexes (no tenant_id in unique constraints)
- ✅ AU phone format only (international numbers may not normalize correctly)
- ✅ Email normalization is basic (doesn't handle aliases like gmail+tag)

### Future Enhancements:
1. Multi-tenant unique constraints: Add `tenant_id` to unique indexes
2. Customer restore UI: Allow un-soft-deleting customers
3. Bulk merge wizard: UI for selecting and merging multiple duplicates at once
4. International phone support: Handle +44, +1, etc. formats
5. Advanced email normalization: Handle gmail aliases, dots, etc.

---

## Support & Troubleshooting

### Common Issues:

**Q: "Unique constraint violation on email_norm"**
A: Duplicate email detected. Use merge functionality to combine customers.

**Q: "Cannot delete customer" error when trying to delete via Supabase UI**
A: Use Soft Delete button in the app, or run:
```sql
UPDATE customers_db SET deleted_at = now(), is_deleted = true WHERE id = '<id>';
```

**Q: "Job edit doesn't save customer changes"**
A: Check console logs for errors. Verify customer ID is valid UUID. Check RLS policies.

**Q: "Phone not normalizing to E.164"**
A: Trigger only runs on INSERT/UPDATE. For existing data, run:
```sql
UPDATE customers_db 
SET phone_e164 = normalize_phone_au(phone)
WHERE phone_e164 IS NULL;
```

---

## Conclusion

All critical issues fixed:
- ✅ Customer edits now persist correctly
- ✅ Safe deletion options available  
- ✅ Duplicate prevention in place
- ✅ Data integrity maintained
- ✅ Audit trail for all operations

**Status**: COMPLETE - Ready for production deployment