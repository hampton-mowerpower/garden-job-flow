-- Add more missing columns to jobs_db
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS service_notes TEXT;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- Create job_payments table
CREATE TABLE IF NOT EXISTS job_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  amount NUMERIC NOT NULL,
  gst_component NUMERIC DEFAULT 0,
  method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_sales_items table
CREATE TABLE IF NOT EXISTS job_sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_change_audit table
CREATE TABLE IF NOT EXISTS customer_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  old_customer_id UUID,
  new_customer_id UUID,
  changed_by TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_notes table
CREATE TABLE IF NOT EXISTS job_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  user_id UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_change_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Open access" ON job_payments FOR ALL USING (true);
CREATE POLICY "Open access" ON job_sales_items FOR ALL USING (true);
CREATE POLICY "Open access" ON customer_change_audit FOR ALL USING (true);
CREATE POLICY "Open access" ON job_notes FOR ALL USING (true);
CREATE POLICY "Open access" ON user_profiles FOR ALL USING (true);

-- Create search RPC functions
CREATE OR REPLACE FUNCTION list_jobs_page(p_before TEXT DEFAULT NULL, p_limit INT DEFAULT 50, p_status TEXT DEFAULT NULL)
RETURNS SETOF jobs_db AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM jobs_db
  WHERE deleted_at IS NULL
    AND (p_status IS NULL OR status = p_status)
    AND (p_before IS NULL OR created_at < p_before::TIMESTAMP WITH TIME ZONE)
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_jobs_by_phone(p_phone TEXT)
RETURNS SETOF jobs_db AS $$
BEGIN
  RETURN QUERY
  SELECT j.* FROM jobs_db j
  JOIN customers_db c ON j.customer_id = c.id
  WHERE c.phone ILIKE '%' || p_phone || '%'
    AND j.deleted_at IS NULL
  ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_job_by_number(p_job_number TEXT)
RETURNS SETOF jobs_db AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM jobs_db
  WHERE job_number ILIKE '%' || p_job_number || '%'
    AND deleted_at IS NULL
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_jobs_by_customer_name(p_name TEXT)
RETURNS SETOF jobs_db AS $$
BEGIN
  RETURN QUERY
  SELECT j.* FROM jobs_db j
  JOIN customers_db c ON j.customer_id = c.id
  WHERE c.name ILIKE '%' || p_name || '%'
    AND j.deleted_at IS NULL
  ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql;