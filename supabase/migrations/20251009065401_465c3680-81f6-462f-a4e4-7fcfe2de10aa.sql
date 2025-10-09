-- Add performance indexes for jobs and related tables
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs_db(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs_db(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_delivered_at ON jobs_db(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs_db(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_parts_job_id ON job_parts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_labour_job_id ON job_labour(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);

-- Add indexes for service reminders
CREATE INDEX IF NOT EXISTS idx_service_reminders_customer_status ON service_reminders(customer_id, status);

-- Add awaiting_stock flag to job_parts for "Waiting for Parts" status
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS awaiting_stock BOOLEAN DEFAULT false;

-- Add quotation tracking fields to jobs
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS quotation_status TEXT DEFAULT NULL;
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS quotation_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN job_parts.awaiting_stock IS 'Indicates if this part is awaiting stock/on order';
COMMENT ON COLUMN jobs_db.quotation_status IS 'Status of quotation: pending, approved, rejected';
COMMENT ON COLUMN jobs_db.quotation_approved_at IS 'When the quotation was approved by customer';