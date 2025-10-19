-- Add final missing tables and columns

-- Add missing columns to parts_catalogue
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS part_group TEXT;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS markup NUMERIC DEFAULT 0;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create quick_problems table
CREATE TABLE IF NOT EXISTS quick_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transport_charge_configs table
CREATE TABLE IF NOT EXISTS transport_charge_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  base_charge NUMERIC DEFAULT 0,
  per_km_charge NUMERIC DEFAULT 0,
  min_charge NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE quick_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_charge_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Open access" ON quick_problems FOR ALL USING (true);
CREATE POLICY "Open access" ON transport_charge_configs FOR ALL USING (true);