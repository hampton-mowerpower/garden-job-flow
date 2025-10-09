-- Backfill Script: Link JB2025-0044 to Citywide Account Customer
-- Run this in Supabase SQL Editor

-- Update the job to link it to Citywide
UPDATE jobs_db
SET 
  account_customer_id = 'b4b30258-b0dc-41c1-abb4-98c1809fb202',
  job_company_name = 'Citywide',
  customer_type = 'commercial',
  updated_at = now()
WHERE job_number = 'JB2025-0044';

-- Verify the update
SELECT 
  job_number,
  job_company_name,
  customer_type,
  account_customer_id,
  (SELECT name FROM account_customers WHERE id = account_customer_id) as account_customer_name
FROM jobs_db
WHERE job_number = 'JB2025-0044';
