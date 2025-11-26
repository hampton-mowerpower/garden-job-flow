-- Fix jobs pointing to merged customers
-- Update jobs to point to the correct merged-into customer
UPDATE jobs_db j
SET customer_id = c.merged_into_id,
    updated_at = NOW()
FROM customers_db c
WHERE j.customer_id = c.id
  AND c.merged_into_id IS NOT NULL
  AND j.deleted_at IS NULL;

-- Log the fix in customer_change_audit
INSERT INTO customer_change_audit (
  job_id,
  job_number,
  old_customer_id,
  old_customer_name,
  old_customer_phone,
  new_customer_id,
  new_customer_name,
  new_customer_phone,
  change_reason,
  changed_by,
  changed_at
)
SELECT 
  j.id,
  j.job_number,
  c_old.id,
  c_old.name,
  c_old.phone,
  c_new.id,
  c_new.name,
  c_new.phone,
  'AUTO-FIX: Updated job to point to merged customer record',
  auth.uid(),
  NOW()
FROM jobs_db j
JOIN customers_db c_old ON j.customer_id = c_old.id
JOIN customers_db c_new ON c_old.merged_into_id = c_new.id
WHERE c_old.merged_into_id IS NOT NULL
  AND j.deleted_at IS NULL;