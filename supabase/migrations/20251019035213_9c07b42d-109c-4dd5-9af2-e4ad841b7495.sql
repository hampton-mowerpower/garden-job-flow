-- Create remaining missing tables that code expects

-- Add tenant_id to jobs_db
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES account_customers(id),
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate_default NUMERIC DEFAULT 0,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create brands table  
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create machinery_models table
CREATE TABLE IF NOT EXISTS machinery_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery_models ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Open access" ON contacts FOR ALL USING (true);
CREATE POLICY "Open access" ON categories FOR ALL USING (true);
CREATE POLICY "Open access" ON brands FOR ALL USING (true);
CREATE POLICY "Open access" ON machinery_models FOR ALL USING (true);

-- Create upsert_contact function
CREATE OR REPLACE FUNCTION upsert_contact(
  p_account_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  INSERT INTO contacts (account_id, full_name, email, phone, role)
  VALUES (p_account_id, p_full_name, p_email, p_phone, p_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role
  RETURNING id INTO v_contact_id;
  
  RETURN v_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;