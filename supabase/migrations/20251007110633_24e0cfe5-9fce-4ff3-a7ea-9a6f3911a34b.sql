-- Phase 2: Multi-Tool, Battery Variants, Requested Finish Date, Small Repair, Customer De-dupe
-- Migration for enhanced booking features

-- 1. Add requested_finish_date to jobs_db
ALTER TABLE jobs_db 
ADD COLUMN IF NOT EXISTS requested_finish_date DATE,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Ensure job_parts has all required fields for Phase 2
ALTER TABLE job_parts
ADD COLUMN IF NOT EXISTS equipment_category TEXT,
ADD COLUMN IF NOT EXISTS part_group TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT DEFAULT 'GST',
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overridden_price NUMERIC,
ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 3. Create job_labour table for tracking labour
CREATE TABLE IF NOT EXISTS job_labour (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id) ON DELETE CASCADE,
  minutes INTEGER NOT NULL DEFAULT 0,
  rate_per_min NUMERIC,
  rate_per_hr NUMERIC,
  calc_total NUMERIC NOT NULL DEFAULT 0,
  override_total NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_labour
ALTER TABLE job_labour ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_labour
CREATE POLICY "Authenticated users can view job labour"
  ON job_labour FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert job labour"
  ON job_labour FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'technician'::text, 'counter'::text]));

CREATE POLICY "Authorized roles can update job labour"
  ON job_labour FOR UPDATE
  USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'technician'::text, 'counter'::text]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'technician'::text, 'counter'::text]));

CREATE POLICY "Admins can delete job labour"
  ON job_labour FOR DELETE
  USING (has_role(auth.uid(), 'admin'::text));

-- 4. Create customer_audit table for de-dupe tracking
CREATE TABLE IF NOT EXISTS customer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'USE_EXISTING', 'KEEP_NEW', 'MERGE'
  old_customer_id UUID REFERENCES customers_db(id),
  new_customer_id UUID REFERENCES customers_db(id),
  merged_into_id UUID REFERENCES customers_db(id),
  performed_by UUID REFERENCES user_profiles(user_id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on customer_audit
ALTER TABLE customer_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_audit
CREATE POLICY "Authenticated users can view customer audit"
  ON customer_audit FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert customer audit"
  ON customer_audit FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));

-- 5. Ensure brands table has proper constraints
-- Brands table should already exist from Phase 1, but let's ensure uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'brands_name_unique_lower'
  ) THEN
    CREATE UNIQUE INDEX brands_name_unique_lower ON brands (LOWER(name));
  END IF;
END $$;

-- 6. Add Multi-Tool category if it doesn't exist
INSERT INTO categories (name, rate_default, display_order, active)
VALUES ('Multi-Tool', 100, 50, true)
ON CONFLICT DO NOTHING;

-- 7. Create Battery category variants for all existing categories
DO $$
DECLARE
  cat RECORD;
  battery_name TEXT;
BEGIN
  FOR cat IN SELECT id, name, rate_default, is_transport_large FROM categories WHERE active = true AND name NOT LIKE 'Battery %'
  LOOP
    battery_name := 'Battery ' || cat.name;
    
    -- Check if battery variant already exists
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = battery_name) THEN
      INSERT INTO categories (name, rate_default, is_transport_large, display_order, active)
      VALUES (battery_name, cat.rate_default, cat.is_transport_large, 100, true);
    END IF;
  END LOOP;
END $$;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_requested_finish_date ON jobs_db(requested_finish_date);
CREATE INDEX IF NOT EXISTS idx_job_parts_equipment_category ON job_parts(equipment_category);
CREATE INDEX IF NOT EXISTS idx_job_parts_part_group ON job_parts(part_group);
CREATE INDEX IF NOT EXISTS idx_job_labour_job_id ON job_labour(job_id);
CREATE INDEX IF NOT EXISTS idx_customer_audit_performed_at ON customer_audit(performed_at);

-- 9. Add trigger for job_labour updated_at
CREATE TRIGGER update_job_labour_updated_at
  BEFORE UPDATE ON job_labour
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE job_labour IS 'Phase 2: Tracks labour hours/minutes for Small Repair section';
COMMENT ON TABLE customer_audit IS 'Phase 2: Logs customer de-duplication actions (use existing, keep new, merge)';
COMMENT ON COLUMN jobs_db.requested_finish_date IS 'Phase 2: Customer requested completion date';
COMMENT ON COLUMN jobs_db.attachments IS 'Phase 2: For Multi-Tool attachments with problem descriptions';
COMMENT ON COLUMN job_parts.is_custom IS 'Phase 2: True for manually added custom parts';
COMMENT ON COLUMN job_parts.overridden_price IS 'Phase 2: Price override for specific job instances';