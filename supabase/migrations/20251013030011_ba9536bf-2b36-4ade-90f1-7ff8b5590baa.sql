
-- ============================================
-- Fix 1: Create accounts and contacts tables
-- ============================================

-- Accounts table (companies)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_norm TEXT GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(trim(name)),
          '[-_/]+', ' ', 'g'
        ),
        '[^a-z0-9 ]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  ) STORED,
  abn TEXT,
  billing_address TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_name_norm_uniq ON public.accounts (name_norm) WHERE active = true;
CREATE INDEX IF NOT EXISTS accounts_name_idx ON public.accounts (name);

-- Contacts table (people)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    trim(first_name || ' ' || coalesce(last_name, ''))
  ) STORED,
  name_norm TEXT GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(trim(trim(first_name || ' ' || coalesce(last_name, '')))),
          '[-_/]+', ' ', 'g'
        ),
        '[^a-z0-9 ]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  ) STORED,
  email TEXT,
  email_lower TEXT GENERATED ALWAYS AS (lower(trim(coalesce(email, '')))) STORED,
  phone TEXT,
  phone_e164 TEXT,
  address TEXT,
  suburb TEXT,
  postcode TEXT,
  notes TEXT,
  customer_type TEXT CHECK (customer_type IN ('domestic', 'commercial')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_account_id_idx ON public.contacts (account_id);
CREATE INDEX IF NOT EXISTS contacts_email_lower_idx ON public.contacts (email_lower) WHERE email_lower != '';
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON public.contacts (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_name_norm_idx ON public.contacts (name_norm);

-- Prevent duplicate contacts within same account
CREATE UNIQUE INDEX IF NOT EXISTS contacts_account_email_uniq 
  ON public.contacts (account_id, email_lower) 
  WHERE account_id IS NOT NULL AND email_lower != '' AND active = true;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_account_phone_uniq 
  ON public.contacts (account_id, phone) 
  WHERE account_id IS NOT NULL AND phone IS NOT NULL AND active = true;

-- ============================================
-- Fix 2: Migrate existing customers to accounts/contacts
-- ============================================

-- First, create accounts from commercial customers with company_name
INSERT INTO public.accounts (name, abn, billing_address, phone, email, notes, active, created_at, updated_at)
SELECT DISTINCT
  company_name,
  company_abn,
  billing_address,
  company_phone,
  company_email,
  'Migrated from customers_db',
  NOT is_deleted,
  created_at,
  updated_at
FROM public.customers_db
WHERE company_name IS NOT NULL 
  AND company_name != ''
  AND merged_into_id IS NULL
ON CONFLICT DO NOTHING;

-- Create contacts from all customers
INSERT INTO public.contacts (
  account_id, 
  first_name, 
  last_name, 
  email, 
  phone, 
  phone_e164,
  address, 
  suburb, 
  postcode, 
  notes, 
  customer_type,
  active,
  created_at,
  updated_at
)
SELECT 
  a.id,
  split_part(c.name, ' ', 1),
  CASE 
    WHEN position(' ' in c.name) > 0 
    THEN substring(c.name from position(' ' in c.name) + 1)
    ELSE NULL 
  END,
  c.email,
  c.phone,
  c.normalized_phone,
  c.address,
  c.suburb,
  c.postcode,
  c.notes,
  c.customer_type::text,
  NOT c.is_deleted,
  c.created_at,
  c.updated_at
FROM public.customers_db c
LEFT JOIN public.accounts a ON a.name_norm = regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(coalesce(c.company_name, ''))),
        '[-_/]+', ' ', 'g'
      ),
      '[^a-z0-9 ]', '', 'g'
    ),
    '\s+', ' ', 'g'
  )
WHERE c.merged_into_id IS NULL
ON CONFLICT DO NOTHING;

-- Create a mapping table to link old customer_id to new contact_id
CREATE TEMP TABLE customer_contact_map AS
SELECT 
  c.id as old_customer_id,
  ct.id as new_contact_id,
  a.id as new_account_id
FROM public.customers_db c
LEFT JOIN public.accounts a ON a.name_norm = regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(coalesce(c.company_name, ''))),
        '[-_/]+', ' ', 'g'
      ),
      '[^a-z0-9 ]', '', 'g'
    ),
    '\s+', ' ', 'g'
  )
LEFT JOIN public.contacts ct ON (
  (ct.account_id = a.id OR (ct.account_id IS NULL AND a.id IS NULL))
  AND lower(trim(ct.full_name)) = lower(trim(c.name))
  AND (ct.phone = c.phone OR ct.email = c.email)
)
WHERE c.merged_into_id IS NULL;

-- ============================================
-- Fix 3: Update jobs_db to reference contacts and accounts
-- ============================================

-- Add new columns to jobs_db
ALTER TABLE public.jobs_db ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE RESTRICT;
ALTER TABLE public.jobs_db ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT;

-- Migrate job references
UPDATE public.jobs_db j
SET 
  contact_id = m.new_contact_id,
  account_id = m.new_account_id
FROM customer_contact_map m
WHERE j.customer_id = m.old_customer_id
  AND j.contact_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS jobs_db_contact_id_idx ON public.jobs_db (contact_id);
CREATE INDEX IF NOT EXISTS jobs_db_account_id_idx ON public.jobs_db (account_id);

-- ============================================
-- Fix 4: RLS Policies for accounts and contacts
-- ============================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Authenticated users can view accounts" 
  ON public.accounts FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can insert accounts" 
  ON public.accounts FOR INSERT 
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

CREATE POLICY "Admin and counter can update accounts" 
  ON public.accounts FOR UPDATE 
  USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

CREATE POLICY "Admin can delete accounts" 
  ON public.accounts FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::text));

-- Contacts policies
CREATE POLICY "Authenticated users can view contacts" 
  ON public.contacts FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can insert contacts" 
  ON public.contacts FOR INSERT 
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

CREATE POLICY "Admin and counter can update contacts" 
  ON public.contacts FOR UPDATE 
  USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

CREATE POLICY "Admin can delete contacts" 
  ON public.contacts FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::text));

-- ============================================
-- Fix 5: Update triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accounts_updated_at();

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contacts_updated_at();
