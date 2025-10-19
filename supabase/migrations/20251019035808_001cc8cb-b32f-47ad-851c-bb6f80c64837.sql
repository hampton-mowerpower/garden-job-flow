-- Add final missing columns to existing tables

-- Add missing columns to jobs_db
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS labour_total NUMERIC DEFAULT 0;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS transport_total_charge NUMERIC DEFAULT 0;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS sharpen_total_charge NUMERIC DEFAULT 0;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS small_repair_total NUMERIC DEFAULT 0;

-- Add normalized_name to brands, categories, machinery_models for search
ALTER TABLE brands ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Add missing columns to machinery_models
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS default_price NUMERIC DEFAULT 0;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS honda_model_code TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS oem_export_required BOOLEAN DEFAULT false;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS warranty_months INT DEFAULT 12;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create parts_audit_log table
CREATE TABLE IF NOT EXISTS parts_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts_catalogue(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE parts_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Open access" ON parts_audit_log FOR ALL USING (true);

-- Create triggers to update normalized_name automatically
CREATE OR REPLACE FUNCTION update_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name = LOWER(TRIM(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_normalize_name
BEFORE INSERT OR UPDATE OF name ON brands
FOR EACH ROW EXECUTE FUNCTION update_normalized_name();

CREATE TRIGGER categories_normalize_name
BEFORE INSERT OR UPDATE OF name ON categories
FOR EACH ROW EXECUTE FUNCTION update_normalized_name();

CREATE TRIGGER machinery_models_normalize_name
BEFORE INSERT OR UPDATE OF name ON machinery_models
FOR EACH ROW EXECUTE FUNCTION update_normalized_name();