-- Add all remaining missing tables and columns

-- Add role to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add missing columns to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS oem_export_required BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to customers_db
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create customer_audit table
CREATE TABLE IF NOT EXISTS customer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers_db(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create machine_category_map table
CREATE TABLE IF NOT EXISTS machine_category_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  size_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update transport_charge_configs with additional columns
ALTER TABLE transport_charge_configs ADD COLUMN IF NOT EXISTS small_medium_base NUMERIC DEFAULT 0;
ALTER TABLE transport_charge_configs ADD COLUMN IF NOT EXISTS large_base NUMERIC DEFAULT 0;
ALTER TABLE transport_charge_configs ADD COLUMN IF NOT EXISTS included_km NUMERIC DEFAULT 0;
ALTER TABLE transport_charge_configs ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC DEFAULT 0;
ALTER TABLE transport_charge_configs ADD COLUMN IF NOT EXISTS origin_address TEXT;

-- Enable RLS
ALTER TABLE customer_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_category_map ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Open access" ON customer_audit FOR ALL USING (true);
CREATE POLICY "Open access" ON machine_category_map FOR ALL USING (true);

-- Create fn_search_customers function
CREATE OR REPLACE FUNCTION fn_search_customers(p_search TEXT)
RETURNS SETOF customers_db AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM customers_db
  WHERE deleted_at IS NULL
    AND (
      name ILIKE '%' || p_search || '%' OR
      phone ILIKE '%' || p_search || '%' OR
      email ILIKE '%' || p_search || '%'
    )
  ORDER BY name
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;