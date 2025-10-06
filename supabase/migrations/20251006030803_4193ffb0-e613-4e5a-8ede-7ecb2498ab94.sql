-- Hampton Mowerpower Phase 3: Complete System with Transport, Sharpen, Parts & Account Features

-- ==========================================
-- A) TRANSPORT & SHARPEN ENHANCEMENTS
-- ==========================================

-- Add missing transport/sharpen fields to jobs_db if they don't exist
DO $$ 
BEGIN
  -- Transport fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs_db' AND column_name = 'transport_pickup_distance_km') THEN
    ALTER TABLE jobs_db ADD COLUMN transport_pickup_distance_km numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs_db' AND column_name = 'transport_delivery_distance_km') THEN
    ALTER TABLE jobs_db ADD COLUMN transport_delivery_distance_km numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs_db' AND column_name = 'transport_distance_source') THEN
    ALTER TABLE jobs_db ADD COLUMN transport_distance_source text;
    ALTER TABLE jobs_db ADD CONSTRAINT jobs_db_transport_distance_source_check 
      CHECK (transport_distance_source IN ('API', 'MANUAL'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs_db' AND column_name = 'transport_breakdown') THEN
    ALTER TABLE jobs_db ADD COLUMN transport_breakdown text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs_db' AND column_name = 'sharpen_breakdown') THEN
    ALTER TABLE jobs_db ADD COLUMN sharpen_breakdown text;
  END IF;
END $$;

-- ==========================================
-- B) ACCOUNT CUSTOMER ENHANCEMENTS
-- ==========================================

-- Add account customer history tracking
CREATE TABLE IF NOT EXISTS account_customer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_customer_id uuid NOT NULL REFERENCES account_customers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('part', 'service', 'repair', 'quote', 'invoice', 'payment')),
  ref_id uuid,
  summary text NOT NULL,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE account_customer_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can view account history" ON account_customer_history;
  DROP POLICY IF EXISTS "Admin and counter can insert account history" ON account_customer_history;
END $$;

CREATE POLICY "Authenticated users can view account history"
  ON account_customer_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can insert account history"
  ON account_customer_history
  FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

-- Enable realtime for account_customer_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'account_customer_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE account_customer_history;
  END IF;
END $$;

-- Add quotation_pdf_url to account_customer_messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'account_customer_messages' AND column_name = 'quotation_pdf_url') THEN
    ALTER TABLE account_customer_messages ADD COLUMN quotation_pdf_url text;
  END IF;
END $$;

-- ==========================================
-- C) CATEGORIES & COMMON BRANDS ENHANCEMENTS
-- ==========================================

-- Ensure categories has all needed fields
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_transport_large') THEN
    ALTER TABLE categories ADD COLUMN is_transport_large boolean DEFAULT false;
  END IF;
END $$;

-- Enable realtime for categories and category_common_brands
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'category_common_brands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE category_common_brands;
  END IF;
END $$;

-- ==========================================
-- D) INVOICE LINES & JOB LINES ENHANCEMENTS
-- ==========================================

-- Add line_memo to invoice_lines for transport/sharpen details
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_lines' AND column_name = 'line_memo') THEN
    ALTER TABLE invoice_lines ADD COLUMN line_memo text;
  END IF;
END $$;

-- ==========================================
-- E) INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_account_customer_history_customer_id ON account_customer_history(account_customer_id);
CREATE INDEX IF NOT EXISTS idx_account_customer_history_created_at ON account_customer_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_problems_display_order ON quick_problems(display_order);
CREATE INDEX IF NOT EXISTS idx_category_common_brands_category ON category_common_brands(category_id);

COMMENT ON TABLE account_customer_history IS 'Timeline of parts, services, repairs, quotes, and invoices for account customers';