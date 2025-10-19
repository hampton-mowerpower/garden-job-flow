-- Add missing columns to existing tables
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS company TEXT;

ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS machine_category TEXT;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS machine_brand TEXT;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS machine_model TEXT;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS machine_serial TEXT;

-- Create account_customers table
CREATE TABLE IF NOT EXISTS account_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emails TEXT[] DEFAULT '{}',
  phone TEXT,
  default_payment_terms TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service_reminders table
CREATE TABLE IF NOT EXISTS service_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers_db(id),
  type TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_db(id),
  customer_id UUID REFERENCES customers_db(id),
  invoice_number TEXT UNIQUE,
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  job_id UUID REFERENCES jobs_db(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quotes_to TEXT[],
  invoices_to TEXT[],
  payments_to TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE account_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (open access for now)
CREATE POLICY "Open access" ON account_customers FOR ALL USING (true);
CREATE POLICY "Open access" ON service_reminders FOR ALL USING (true);
CREATE POLICY "Open access" ON invoices FOR ALL USING (true);
CREATE POLICY "Open access" ON payments FOR ALL USING (true);
CREATE POLICY "Open access" ON accounts FOR ALL USING (true);

-- Create find_customer_duplicates function
CREATE OR REPLACE FUNCTION find_customer_duplicates()
RETURNS TABLE (
  customer_id UUID,
  duplicate_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c1.id as customer_id,
    array_agg(DISTINCT c2.id) as duplicate_ids
  FROM customers_db c1
  JOIN customers_db c2 ON (
    c1.id < c2.id AND (
      c1.phone = c2.phone OR 
      (c1.email IS NOT NULL AND c1.email = c2.email)
    )
  )
  WHERE c1.deleted_at IS NULL AND c2.deleted_at IS NULL
  GROUP BY c1.id;
END;
$$ LANGUAGE plpgsql;