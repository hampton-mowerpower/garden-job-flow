-- Add customer_type enum
DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM ('commercial', 'domestic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add customer_type to customers_db (default to domestic for existing customers)
ALTER TABLE customers_db 
ADD COLUMN IF NOT EXISTS customer_type customer_type DEFAULT 'domestic';

-- Add customer_type, company_name, and delivered_at to jobs_db
ALTER TABLE jobs_db
ADD COLUMN IF NOT EXISTS customer_type customer_type,
ADD COLUMN IF NOT EXISTS job_company_name text,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

-- Extend service_reminders table with machine tracking columns (already has the core columns)
ALTER TABLE service_reminders
ADD COLUMN IF NOT EXISTS machine_category text,
ADD COLUMN IF NOT EXISTS machine_brand text,
ADD COLUMN IF NOT EXISTS machine_model text,
ADD COLUMN IF NOT EXISTS machine_serial text;

-- Create index for efficient reminder queries by date and status
CREATE INDEX IF NOT EXISTS idx_service_reminders_date_status 
ON service_reminders(reminder_date, status) 
WHERE status = 'pending';

-- Add comments
COMMENT ON COLUMN customers_db.customer_type IS 'Customer type: commercial (3-month reminders) or domestic (11-month reminders)';
COMMENT ON COLUMN jobs_db.customer_type IS 'Customer type at time of job creation';
COMMENT ON COLUMN jobs_db.job_company_name IS 'Company name for this specific job (may differ from customer profile)';
COMMENT ON COLUMN jobs_db.delivered_at IS 'Timestamp when job status changed to delivered - triggers service reminder scheduling';
COMMENT ON COLUMN service_reminders.machine_category IS 'Machine category for tracking which machine needs service';
COMMENT ON COLUMN service_reminders.machine_brand IS 'Machine brand for reminder context';
COMMENT ON COLUMN service_reminders.machine_model IS 'Machine model for reminder context';
COMMENT ON COLUMN service_reminders.machine_serial IS 'Machine serial number for unique tracking';