
-- Fix JB2025-0028 customer link (minimal insert)
-- First, ensure Stephen Swirgoski customer exists (only non-generated columns)
INSERT INTO customers_db (
  name,
  phone,
  address
) 
SELECT 
  'Stephen Swirgoski',
  '0418178331',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM customers_db WHERE phone LIKE '%0418178331%'
);

-- Update JB2025-0028 to link to Stephen Swirgoski
UPDATE jobs_db
SET 
  customer_id = (SELECT id FROM customers_db WHERE phone LIKE '%0418178331%' LIMIT 1),
  version = version + 1,
  updated_at = now()
WHERE job_number = 'JB2025-0028';

-- Log this correction in audit_log
INSERT INTO audit_log (
  table_name,
  record_id,
  operation,
  old_values,
  new_values,
  changed_fields,
  changed_by,
  source
)
SELECT 
  'jobs_db',
  j.id::text,
  'CORRECTION',
  jsonb_build_object(
    'customer_id', 'c4d9a91a-16e2-4b1f-bb5c-bb48e9d079b8',
    'customer_name', 'Ian Lacey',
    'customer_phone', '0414930164'
  ),
  jsonb_build_object(
    'customer_id', (SELECT id FROM customers_db WHERE phone LIKE '%0418178331%' LIMIT 1),
    'customer_name', 'Stephen Swirgoski',
    'customer_phone', '0418178331'
  ),
  ARRAY['customer_id'],
  COALESCE((SELECT id::text FROM auth.users WHERE email = 'fonzren@gmail.com' LIMIT 1), 'admin'),
  'manual_correction: User requested JB2025-0028 be linked to Stephen Swirgoski instead of Ian Lacey'
FROM jobs_db j
WHERE j.job_number = 'JB2025-0028';

-- Add review status columns to audit_log if not exists
ALTER TABLE audit_log 
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_status TEXT,
ADD COLUMN IF NOT EXISTS review_by TEXT,
ADD COLUMN IF NOT EXISTS review_at TIMESTAMP;

-- Create indexes for faster change review queries
CREATE INDEX IF NOT EXISTS idx_audit_log_reviewed ON audit_log(reviewed, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
