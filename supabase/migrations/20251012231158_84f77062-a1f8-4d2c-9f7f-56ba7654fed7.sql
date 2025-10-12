-- Add normalized fields for customer dedupe/matching
ALTER TABLE customers_db 
  ADD COLUMN IF NOT EXISTS normalized_email text,
  ADD COLUMN IF NOT EXISTS normalized_phone text;

-- Create function to normalize customer fields
CREATE OR REPLACE FUNCTION normalize_customer_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  NEW.normalized_phone := REGEXP_REPLACE(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-normalize on insert/update
DROP TRIGGER IF EXISTS normalize_customer_fields_trigger ON customers_db;
CREATE TRIGGER normalize_customer_fields_trigger
  BEFORE INSERT OR UPDATE ON customers_db
  FOR EACH ROW
  EXECUTE FUNCTION normalize_customer_fields();

-- Backfill existing customers
UPDATE customers_db SET 
  normalized_email = LOWER(TRIM(COALESCE(email, ''))),
  normalized_phone = REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')
WHERE normalized_email IS NULL OR normalized_phone IS NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_normalized_email ON customers_db(normalized_email) WHERE normalized_email IS NOT NULL AND normalized_email != '';
CREATE INDEX IF NOT EXISTS idx_customers_normalized_phone ON customers_db(normalized_phone) WHERE normalized_phone IS NOT NULL AND normalized_phone != '';
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db(customer_id) WHERE customer_id IS NOT NULL;