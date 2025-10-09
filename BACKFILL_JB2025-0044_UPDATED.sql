-- Backfill Script: Link JB2025-0044 to Citywide Account Customer
-- Run this in Supabase SQL Editor

-- First, ensure the Citywide account customer exists
DO $$
DECLARE
  citywide_id uuid;
BEGIN
  -- Try to find Citywide account customer
  SELECT id INTO citywide_id FROM account_customers WHERE name ILIKE 'Citywide' AND active = true LIMIT 1;
  
  -- If not found, create it
  IF citywide_id IS NULL THEN
    INSERT INTO account_customers (name, emails, phone, default_payment_terms, active)
    VALUES ('Citywide', ARRAY[]::text[], NULL, '30 days', true)
    RETURNING id INTO citywide_id;
    
    RAISE NOTICE 'Created new Citywide account customer with ID: %', citywide_id;
  ELSE
    RAISE NOTICE 'Found existing Citywide account customer with ID: %', citywide_id;
  END IF;
  
  -- Update the job to link it to Citywide
  UPDATE jobs_db
  SET 
    account_customer_id = citywide_id,
    job_company_name = 'Citywide',
    customer_type = 'commercial',
    updated_at = now()
  WHERE job_number = 'JB2025-0044';
  
  RAISE NOTICE 'Job JB2025-0044 linked to Citywide';
END $$;

-- Verify the update
SELECT 
  job_number,
  job_company_name,
  customer_type,
  account_customer_id,
  (SELECT name FROM account_customers WHERE id = jobs_db.account_customer_id) as account_customer_name
FROM jobs_db
WHERE job_number = 'JB2025-0044';
