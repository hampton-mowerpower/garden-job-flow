
-- ============================================
-- FIX PART 2: Data Recovery & Schema Hardening
-- ============================================

-- PHASE 1: STABILIZATION MODE
-- ============================

CREATE TABLE IF NOT EXISTS system_maintenance_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_type text NOT NULL,
  affected_tables text[] NOT NULL,
  excluded_roles text[] NOT NULL DEFAULT ARRAY['admin']::text[],
  reason text,
  enabled_at timestamptz DEFAULT now(),
  enabled_by uuid REFERENCES auth.users(id),
  disabled_at timestamptz
);

-- Enable read-only mode
INSERT INTO system_maintenance_mode (mode_type, affected_tables, reason, enabled_by)
VALUES (
  'read_only',
  ARRAY['customers_db', 'jobs_db', 'job_parts', 'job_payments', 'invoices', 'invoice_lines']::text[],
  'Emergency data integrity audit - Jobs 0061, 0042 recovery',
  (SELECT id FROM auth.users WHERE email = 'hamptonmowerpower@gmail.com' LIMIT 1)
);

-- PHASE 2: DATA RECOVERY - Job 0061 (Carrie from Wood Culture Services)
-- =======================================================================

DO $$
DECLARE
  v_carrie_id uuid;
  v_gaye_id uuid := 'cc9bbb0a-63cd-4ee4-8bec-8881e8f7a44f';
  v_job_0061_id uuid := '6ac36969-0c41-4b0d-840f-0d8a988d3bbd';
BEGIN
  -- Find or create Carrie customer with correct phone
  SELECT id INTO v_carrie_id
  FROM customers_db
  WHERE phone_digits = '0422408306'
    AND is_deleted = false
  LIMIT 1;
  
  IF v_carrie_id IS NULL THEN
    INSERT INTO customers_db (
      name, phone, email, address, 
      company_name, customer_type, is_deleted
    ) VALUES (
      'Carrie',
      '0422408306',
      NULL,
      '',
      'Wood Culture Services',
      'commercial',
      false
    )
    RETURNING id INTO v_carrie_id;
    
    RAISE NOTICE 'Created Carrie customer: %', v_carrie_id;
  ELSE
    RAISE NOTICE 'Found existing Carrie customer: %', v_carrie_id;
  END IF;
  
  -- Update Job 0061 to correct customer
  UPDATE jobs_db
  SET customer_id = v_carrie_id, updated_at = now()
  WHERE id = v_job_0061_id;
  
  -- Log recovery
  INSERT INTO customer_change_audit (
    job_id, job_number,
    old_customer_id, old_customer_name, old_customer_phone,
    new_customer_id, new_customer_name, new_customer_phone,
    change_reason, changed_by, changed_at
  ) VALUES (
    v_job_0061_id, 'JB2025-0061',
    v_gaye_id, 'Gaye Moody', '0395984896',
    v_carrie_id, 'Carrie', '0422408306',
    'FORENSIC RECOVERY: Restored to correct customer (Wood Culture Services)',
    (SELECT id FROM auth.users WHERE email = 'hamptonmowerpower@gmail.com' LIMIT 1),
    now()
  );
  
  RAISE NOTICE 'Job 0061 restored to Carrie (%, 0422408306)', v_carrie_id;
END $$;

-- PHASE 3: SCHEMA HARDENING - Set NOT NULL with safe defaults
-- ============================================================

-- Update NULL values first, then set NOT NULL
UPDATE jobs_db SET job_number = 'UNKNOWN' WHERE job_number IS NULL;
UPDATE jobs_db SET machine_category = 'Other' WHERE machine_category IS NULL;
UPDATE jobs_db SET machine_brand = 'Unknown' WHERE machine_brand IS NULL;
UPDATE jobs_db SET machine_model = 'Unknown' WHERE machine_model IS NULL;
UPDATE jobs_db SET problem_description = '' WHERE problem_description IS NULL;
UPDATE jobs_db SET status = 'pending' WHERE status IS NULL;
UPDATE jobs_db SET labour_hours = 0 WHERE labour_hours IS NULL;
UPDATE jobs_db SET labour_rate = 0 WHERE labour_rate IS NULL;
UPDATE jobs_db SET parts_subtotal = 0 WHERE parts_subtotal IS NULL;
UPDATE jobs_db SET labour_total = 0 WHERE labour_total IS NULL;
UPDATE jobs_db SET subtotal = 0 WHERE subtotal IS NULL;
UPDATE jobs_db SET gst = 0 WHERE gst IS NULL;
UPDATE jobs_db SET grand_total = 0 WHERE grand_total IS NULL;
UPDATE jobs_db SET balance_due = 0 WHERE balance_due IS NULL;

-- Now set NOT NULL constraints
ALTER TABLE jobs_db
  ALTER COLUMN job_number SET NOT NULL,
  ALTER COLUMN machine_category SET NOT NULL,
  ALTER COLUMN machine_brand SET NOT NULL,
  ALTER COLUMN machine_model SET NOT NULL,
  ALTER COLUMN problem_description SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN labour_hours SET NOT NULL,
  ALTER COLUMN labour_hours SET DEFAULT 0,
  ALTER COLUMN labour_rate SET NOT NULL,
  ALTER COLUMN labour_rate SET DEFAULT 0,
  ALTER COLUMN parts_subtotal SET NOT NULL,
  ALTER COLUMN parts_subtotal SET DEFAULT 0,
  ALTER COLUMN labour_total SET NOT NULL,
  ALTER COLUMN labour_total SET DEFAULT 0,
  ALTER COLUMN subtotal SET NOT NULL,
  ALTER COLUMN subtotal SET DEFAULT 0,
  ALTER COLUMN gst SET NOT NULL,
  ALTER COLUMN gst SET DEFAULT 0,
  ALTER COLUMN grand_total SET NOT NULL,
  ALTER COLUMN grand_total SET DEFAULT 0,
  ALTER COLUMN balance_due SET NOT NULL,
  ALTER COLUMN balance_due SET DEFAULT 0;

-- Customers constraints
UPDATE customers_db SET address = '' WHERE address IS NULL;
ALTER TABLE customers_db
  ALTER COLUMN address SET NOT NULL,
  ALTER COLUMN address SET DEFAULT '';

-- Job parts constraints
UPDATE job_parts SET quantity = 1 WHERE quantity IS NULL;
UPDATE job_parts SET unit_price = 0 WHERE unit_price IS NULL;
UPDATE job_parts SET total_price = 0 WHERE total_price IS NULL;
UPDATE job_parts SET description = 'Unknown Part' WHERE description IS NULL;

ALTER TABLE job_parts
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN unit_price SET NOT NULL,
  ALTER COLUMN unit_price SET DEFAULT 0,
  ALTER COLUMN total_price SET NOT NULL,
  ALTER COLUMN total_price SET DEFAULT 0;
