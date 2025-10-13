
-- Fix contacts table structure (avoiding nested generated columns)

-- 1. Create normalization functions first
CREATE OR REPLACE FUNCTION normalize_contact_name(txt text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT regexp_replace(
    regexp_replace(
      trim(lower(coalesce($1, ''))), 
      '[-_/]+', ' ', 'g'
    ), 
    '\s+', ' ', 'g'
  )
$$;

CREATE OR REPLACE FUNCTION normalize_phone(phone_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN $1 IS NULL OR trim($1) = '' THEN ''
    ELSE regexp_replace($1, '[^0-9+]', '', 'g')
  END
$$;

-- 2. Drop existing generated columns
ALTER TABLE contacts DROP COLUMN IF EXISTS full_name CASCADE;
ALTER TABLE contacts DROP COLUMN IF EXISTS name_norm CASCADE;
ALTER TABLE contacts DROP COLUMN IF EXISTS phone_e164 CASCADE;
ALTER TABLE contacts DROP COLUMN IF EXISTS email_lower CASCADE;

-- 3. Add display_name column if not exists
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS display_name text;

-- 4. Create full_name as regular column (will use trigger)
ALTER TABLE contacts ADD COLUMN full_name text;

-- 5. Create trigger to maintain full_name
CREATE OR REPLACE FUNCTION update_contact_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.full_name := CASE 
    WHEN NEW.last_name IS NOT NULL AND NEW.last_name != '' 
    THEN trim(NEW.first_name || ' ' || NEW.last_name)
    ELSE NEW.first_name
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_contact_full_name ON contacts;
CREATE TRIGGER trg_update_contact_full_name
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_full_name();

-- 6. Add normalized columns as generated
ALTER TABLE contacts 
  ADD COLUMN name_norm text 
  GENERATED ALWAYS AS (
    normalize_contact_name(
      CASE 
        WHEN display_name IS NOT NULL AND display_name != '' 
        THEN display_name
        ELSE trim(first_name || ' ' || coalesce(last_name, ''))
      END
    )
  ) STORED;

ALTER TABLE contacts 
  ADD COLUMN phone_e164 text 
  GENERATED ALWAYS AS (normalize_phone(phone)) STORED;

ALTER TABLE contacts 
  ADD COLUMN email_lower text 
  GENERATED ALWAYS AS (lower(trim(coalesce(email, '')))) STORED;

-- 7. Update existing rows
UPDATE contacts SET first_name = first_name WHERE true;

-- 8. Create unique index to prevent duplicates
DROP INDEX IF EXISTS ux_contacts_account_identity;
CREATE UNIQUE INDEX ux_contacts_account_identity 
  ON contacts (
    coalesce(account_id::text, ''),
    coalesce(phone_e164, ''),
    coalesce(email_lower, ''),
    name_norm
  )
  WHERE active = true;

-- 9. Update RLS policies
DROP POLICY IF EXISTS contacts_tenant_access ON contacts;
DROP POLICY IF EXISTS contacts_all_tenant ON contacts;
DROP POLICY IF EXISTS "Admin and counter can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Admin and counter can update contacts" ON contacts;
DROP POLICY IF EXISTS "Admin can delete contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;

CREATE POLICY contacts_authenticated_access 
  ON contacts 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 10. Create upsert function
CREATE OR REPLACE FUNCTION upsert_contact(
  p_account_id uuid,
  p_first_name text,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_tenant_id uuid;
  v_normalized_phone text;
  v_normalized_email text;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, (auth.jwt()->>'tenant_id')::uuid);
  v_normalized_phone := normalize_phone(p_phone);
  v_normalized_email := lower(trim(coalesce(p_email, '')));

  -- Try to find existing contact by phone or email
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE account_id = p_account_id
    AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id)
    AND active = true
    AND (
      (v_normalized_phone != '' AND phone_e164 = v_normalized_phone)
      OR (v_normalized_email != '' AND email_lower = v_normalized_email)
    )
  ORDER BY 
    CASE WHEN phone_e164 = v_normalized_phone THEN 1 ELSE 2 END,
    CASE WHEN email_lower = v_normalized_email THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    -- Update existing contact
    UPDATE contacts
    SET 
      first_name = p_first_name,
      last_name = COALESCE(p_last_name, last_name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      updated_at = now()
    WHERE id = v_contact_id;
  ELSE
    -- Insert new contact
    INSERT INTO contacts (
      id,
      tenant_id,
      account_id,
      first_name,
      last_name,
      phone,
      email,
      active
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      p_account_id,
      p_first_name,
      p_last_name,
      p_phone,
      p_email,
      true
    )
    RETURNING id INTO v_contact_id;
  END IF;

  RETURN v_contact_id;
END;
$$;
