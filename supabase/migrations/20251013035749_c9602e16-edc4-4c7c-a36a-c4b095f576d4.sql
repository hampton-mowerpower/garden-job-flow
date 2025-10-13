-- Fix contacts uniqueness: allow shared emails within accounts
-- Uniqueness now based on (name_norm + phone) OR (name_norm + email), not email alone

-- Drop the old unique index that was blocking shared emails
DROP INDEX IF EXISTS ux_contacts_account_identity;
DROP INDEX IF EXISTS ux_contacts_email_global;
DROP INDEX IF EXISTS ux_contacts_email_per_account;

-- Create composite uniqueness constraints
-- Allow same email across different contacts if name or phone differs
CREATE UNIQUE INDEX ux_contacts_acct_name_phone
  ON contacts(tenant_id, account_id, name_norm, COALESCE(phone_e164,''))
  WHERE active = true AND display_name IS NOT NULL AND phone_e164 IS NOT NULL;

CREATE UNIQUE INDEX ux_contacts_acct_name_email
  ON contacts(tenant_id, account_id, name_norm, COALESCE(email_lower,''))
  WHERE active = true AND display_name IS NOT NULL AND email_lower IS NOT NULL;

-- Add email routing to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS quotes_to text[] DEFAULT '{}';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS invoices_to text[] DEFAULT '{}';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payments_to text[] DEFAULT '{}';

-- Update upsert_contact to use new uniqueness logic (name+phone OR name+email, NOT email alone)
CREATE OR REPLACE FUNCTION public.upsert_contact(
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
AS $function$
DECLARE
  v_contact_id uuid;
  v_tenant_id uuid;
  v_normalized_phone text;
  v_normalized_email text;
  v_display_name text;
  v_name_norm text;
BEGIN
  v_tenant_id := COALESCE(p_tenant_id, (auth.jwt()->>'tenant_id')::uuid);
  v_normalized_phone := normalize_phone(p_phone);
  v_normalized_email := lower(trim(coalesce(p_email, '')));
  v_display_name := CASE 
    WHEN p_last_name IS NOT NULL AND p_last_name != '' 
    THEN trim(p_first_name || ' ' || p_last_name)
    ELSE p_first_name
  END;
  v_name_norm := normalize_contact_name(v_display_name);

  -- Try to find existing contact by (name + phone) OR (name + email)
  -- Do NOT match by email alone
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE account_id = p_account_id
    AND (v_tenant_id IS NULL OR tenant_id = v_tenant_id)
    AND active = true
    AND (
      -- Match by name + phone
      (v_normalized_phone != '' AND phone_e164 = v_normalized_phone AND name_norm = v_name_norm)
      OR
      -- Match by name + email
      (v_normalized_email != '' AND email_lower = v_normalized_email AND name_norm = v_name_norm)
    )
  ORDER BY 
    CASE WHEN phone_e164 = v_normalized_phone AND name_norm = v_name_norm THEN 1 ELSE 2 END,
    CASE WHEN email_lower = v_normalized_email AND name_norm = v_name_norm THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_contact_id IS NOT NULL THEN
    -- Update existing contact
    UPDATE contacts
    SET 
      first_name = p_first_name,
      last_name = COALESCE(p_last_name, last_name),
      display_name = v_display_name,
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      updated_at = now()
    WHERE id = v_contact_id;
  ELSE
    -- Insert new contact (allows same email if name/phone differs)
    INSERT INTO contacts (
      id,
      tenant_id,
      account_id,
      first_name,
      last_name,
      display_name,
      phone,
      email,
      active
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      p_account_id,
      p_first_name,
      p_last_name,
      v_display_name,
      p_phone,
      p_email,
      true
    )
    RETURNING id INTO v_contact_id;
  END IF;

  RETURN v_contact_id;
END;
$function$;