-- FIX CIRCULAR MERGE CORRUPTION
-- Break the circular references by keeping the active records

-- Barry Riccard: Keep 8ba141bb (active), remove its merged_into_id
UPDATE customers_db
SET merged_into_id = NULL,
    updated_at = NOW()
WHERE id = '8ba141bb-d9e5-4e53-a5b7-8ba8bb4db6c5';

-- Craig Williams: Keep 63e112cd (active), remove its merged_into_id  
UPDATE customers_db
SET merged_into_id = NULL,
    updated_at = NOW()
WHERE id = '63e112cd-2bb7-4f32-a358-864b7fc712e9';

-- Verify jobs point to the correct active customers
UPDATE jobs_db
SET customer_id = '8ba141bb-d9e5-4e53-a5b7-8ba8bb4db6c5'
WHERE job_number IN ('JB2025-0012', 'JB2025-0018');

UPDATE jobs_db
SET customer_id = '63e112cd-2bb7-4f32-a358-864b7fc712e9'
WHERE job_number IN ('JB2025-0024', 'JB2025-0025');

-- Log the corruption fix
INSERT INTO customer_audit (
  action,
  old_customer_id,
  details,
  performed_by,
  performed_at
) VALUES (
  'CIRCULAR_MERGE_FIX',
  '8ba141bb-d9e5-4e53-a5b7-8ba8bb4db6c5',
  '{"issue": "Circular merge reference between Barry Riccard records", "resolution": "Removed merged_into_id from active record"}',
  auth.uid(),
  NOW()
), (
  'CIRCULAR_MERGE_FIX',
  '63e112cd-2bb7-4f32-a358-864b7fc712e9',
  '{"issue": "Circular merge reference between Craig Williams records", "resolution": "Removed merged_into_id from active record"}',
  auth.uid(),
  NOW()
);