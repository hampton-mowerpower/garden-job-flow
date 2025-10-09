-- Add company details fields to customers_db table
ALTER TABLE customers_db 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_abn TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Add index for company lookups
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers_db(company_name) WHERE company_name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customers_db.company_name IS 'Optional company name for business customers';
COMMENT ON COLUMN customers_db.company_abn IS 'Australian Business Number for company';
COMMENT ON COLUMN customers_db.billing_address IS 'Separate billing address if different from service address';
