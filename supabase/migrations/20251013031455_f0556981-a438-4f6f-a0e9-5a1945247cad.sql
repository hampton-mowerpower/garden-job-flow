
-- ============================================================
-- CITYWIDE CONTACTS RECOVERY (Fixed)
-- ============================================================

-- Step 1: Add tenant_id column to tables (if not exists)
ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

ALTER TABLE contacts 
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

ALTER TABLE jobs_db 
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Step 2: Add normalized fields for contacts (skip if generated columns exist)
DO $$ 
BEGIN
  -- Add phone_e164 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'phone_e164'
  ) THEN
    ALTER TABLE contacts ADD COLUMN phone_e164 text;
  END IF;

  -- Add email_lower if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'email_lower'
  ) THEN
    ALTER TABLE contacts ADD COLUMN email_lower text;
  END IF;
END $$;

-- Step 3: Create function to recover contacts from customer records
CREATE OR REPLACE FUNCTION recover_citywide_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  citywide_account_id uuid;
  recovered_count integer := 0;
  contact_record record;
BEGIN
  -- Find Citywide account
  SELECT id INTO citywide_account_id
  FROM accounts
  WHERE lower(name) = 'citywide'
  LIMIT 1;

  IF citywide_account_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Citywide account not found'
    );
  END IF;

  -- Find distinct customers that should be contacts
  FOR contact_record IN
    SELECT DISTINCT
      c.name,
      c.phone,
      c.email
    FROM customers_db c
    WHERE (lower(c.company_name) = 'citywide' OR lower(c.name) LIKE '%citywide%')
      AND c.is_deleted = false
      AND c.name <> 'Ronin (citywide)' -- Skip the main contact we already have
      AND NOT EXISTS (
        SELECT 1 
        FROM contacts ct 
        WHERE ct.account_id = citywide_account_id
          AND (
            (ct.phone IS NOT NULL AND ct.phone = c.phone)
            OR (ct.email IS NOT NULL AND lower(ct.email) = lower(c.email))
            OR (lower(ct.full_name) = lower(c.name))
          )
      )
  LOOP
    -- Create new contact
    INSERT INTO contacts (
      id,
      account_id,
      full_name,
      first_name,
      last_name,
      phone,
      email,
      active
    ) VALUES (
      gen_random_uuid(),
      citywide_account_id,
      contact_record.name,
      split_part(contact_record.name, ' ', 1),
      CASE 
        WHEN position(' ' in contact_record.name) > 0 
        THEN substring(contact_record.name from position(' ' in contact_record.name) + 1)
        ELSE ''
      END,
      contact_record.phone,
      contact_record.email,
      true
    );
    
    recovered_count := recovered_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', citywide_account_id,
    'recovered_contacts', recovered_count,
    'message', format('Recovered %s contacts for Citywide', recovered_count)
  );
END;
$$;

-- Step 4: Create function to link jobs to correct contacts
CREATE OR REPLACE FUNCTION link_jobs_to_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Link jobs to contacts based on customer_id match
  WITH matched_contacts AS (
    SELECT DISTINCT
      j.id as job_id,
      ct.id as contact_id,
      ct.account_id as account_id
    FROM jobs_db j
    JOIN customers_db c ON j.customer_id = c.id
    JOIN contacts ct ON (
      ct.account_id IS NOT NULL
      AND (
        (ct.phone IS NOT NULL AND ct.phone = c.phone)
        OR (ct.email IS NOT NULL AND lower(ct.email) = lower(c.email))
        OR (lower(ct.full_name) = lower(c.name))
      )
    )
    WHERE j.contact_id IS NULL OR j.account_id IS NULL
  )
  UPDATE jobs_db j
  SET 
    contact_id = mc.contact_id,
    account_id = mc.account_id
  FROM matched_contacts mc
  WHERE j.id = mc.job_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_jobs', updated_count,
    'message', format('Updated %s jobs with contact and account links', updated_count)
  );
END;
$$;

COMMENT ON FUNCTION recover_citywide_contacts() IS 'Recovers missing Citywide contacts from customers_db table';
COMMENT ON FUNCTION link_jobs_to_contacts() IS 'Links jobs to correct contacts based on customer data';
