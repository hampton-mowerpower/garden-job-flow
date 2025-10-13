-- Fix job_notes foreign key constraint and phone validation

-- 1. Drop the incorrect foreign key constraint on job_notes
ALTER TABLE job_notes
  DROP CONSTRAINT IF EXISTS job_notes_created_by_fkey;

-- 2. Add correct foreign key to auth.users
ALTER TABLE job_notes
  ADD CONSTRAINT job_notes_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 3. Create trigger to auto-set created_by from auth context
CREATE OR REPLACE FUNCTION set_job_note_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_job_note_author ON job_notes;
CREATE TRIGGER trg_set_job_note_author
  BEFORE INSERT ON job_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_job_note_author();

-- 4. Add phone validation columns to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS phone_local TEXT,
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

-- 5. Add check constraint for 10-digit phone validation
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_phone_local_chk;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_phone_local_chk
  CHECK (phone_local IS NULL OR phone_local ~ '^\d{10}$');

-- 6. Create function to normalize phone to E.164 format
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone_local TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone_local IS NULL OR phone_local !~ '^\d{10}$' THEN
    RETURN NULL;
  END IF;
  
  -- Mobile: starts with 04, convert to +614...
  IF phone_local ~ '^04' THEN
    RETURN '+61' || substring(phone_local from 2);
  END IF;
  
  -- Landline: starts with 02, 03, 07, 08, convert to +61...
  IF phone_local ~ '^0[2378]' THEN
    RETURN '+61' || substring(phone_local from 2);
  END IF;
  
  -- Other formats, just prefix +61
  RETURN '+61' || substring(phone_local from 2);
END;
$$;

-- 7. Create trigger to auto-compute phone_e164 from phone_local
CREATE OR REPLACE FUNCTION set_contact_phone_e164()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone_local IS NOT NULL THEN
    NEW.phone_e164 := normalize_phone_e164(NEW.phone_local);
  END IF;
  
  -- Also handle the main phone field if phone_local is not set
  IF NEW.phone_local IS NULL AND NEW.phone IS NOT NULL AND NEW.phone ~ '^\d{10}$' THEN
    NEW.phone_local := NEW.phone;
    NEW.phone_e164 := normalize_phone_e164(NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_contact_phone_e164 ON contacts;
CREATE TRIGGER trg_set_contact_phone_e164
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_contact_phone_e164();

-- 8. Add phone validation to customers_db table as well
ALTER TABLE customers_db
  ADD COLUMN IF NOT EXISTS phone_local TEXT,
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

ALTER TABLE customers_db
  DROP CONSTRAINT IF EXISTS customers_phone_local_chk;

ALTER TABLE customers_db
  ADD CONSTRAINT customers_phone_local_chk
  CHECK (phone_local IS NULL OR phone_local ~ '^\d{10}$');

-- 9. Create trigger for customers_db phone normalization
CREATE OR REPLACE FUNCTION set_customer_phone_e164()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone_local IS NOT NULL THEN
    NEW.phone_e164 := normalize_phone_e164(NEW.phone_local);
  END IF;
  
  -- Also handle the main phone field
  IF NEW.phone_local IS NULL AND NEW.phone IS NOT NULL AND NEW.phone ~ '^\d{10}$' THEN
    NEW.phone_local := NEW.phone;
    NEW.phone_e164 := normalize_phone_e164(NEW.phone);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_customer_phone_e164 ON customers_db;
CREATE TRIGGER trg_set_customer_phone_e164
  BEFORE INSERT OR UPDATE ON customers_db
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_phone_e164();