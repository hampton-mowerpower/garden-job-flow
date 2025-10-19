-- Create all remaining missing tables

-- Email outbox table
CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Parts catalogue table
CREATE TABLE IF NOT EXISTS parts_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  base_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Job parts table (if not exists)
CREATE TABLE IF NOT EXISTS job_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  part_id UUID REFERENCES parts_catalogue(id),
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add active column to account_customers if missing
ALTER TABLE account_customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add note_text and visibility to job_notes
ALTER TABLE job_notes ADD COLUMN IF NOT EXISTS note_text TEXT;
ALTER TABLE job_notes ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'internal';

-- Enable RLS
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Open access" ON email_outbox FOR ALL USING (true);
CREATE POLICY "Open access" ON parts_catalogue FOR ALL USING (true);
CREATE POLICY "Open access" ON job_parts FOR ALL USING (true);

-- Create missing RPC functions
CREATE OR REPLACE FUNCTION find_duplicate_categories()
RETURNS TABLE (
  category_id UUID,
  duplicate_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c1.id as category_id,
    array_agg(DISTINCT c2.id) as duplicate_ids
  FROM categories c1
  JOIN categories c2 ON c1.id < c2.id AND LOWER(c1.name) = LOWER(c2.name)
  GROUP BY c1.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION find_duplicate_brands()
RETURNS TABLE (
  brand_id UUID,
  duplicate_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b1.id as brand_id,
    array_agg(DISTINCT b2.id) as duplicate_ids
  FROM brands b1
  JOIN brands b2 ON b1.id < b2.id AND LOWER(b1.name) = LOWER(b2.name)
  GROUP BY b1.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION merge_categories(p_keep_id UUID, p_merge_ids UUID[])
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE brands SET category_id = p_keep_id WHERE category_id = ANY(p_merge_ids);
  UPDATE machinery_models SET category_id = p_keep_id WHERE category_id = ANY(p_merge_ids);
  DELETE FROM categories WHERE id = ANY(p_merge_ids);
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION merge_brands(p_keep_id UUID, p_merge_ids UUID[])
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE machinery_models SET brand_id = p_keep_id WHERE brand_id = ANY(p_merge_ids);
  DELETE FROM brands WHERE id = ANY(p_merge_ids);
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;