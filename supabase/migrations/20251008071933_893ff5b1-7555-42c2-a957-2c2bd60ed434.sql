-- Add small repair fields to jobs_db table
ALTER TABLE jobs_db 
ADD COLUMN IF NOT EXISTS small_repair_details TEXT,
ADD COLUMN IF NOT EXISTS small_repair_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS small_repair_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS small_repair_total DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN jobs_db.small_repair_details IS 'Description of small repair work performed';
COMMENT ON COLUMN jobs_db.small_repair_minutes IS 'Time spent on small repair in minutes';
COMMENT ON COLUMN jobs_db.small_repair_rate IS 'Rate charged for small repair (per hour or per minute)';
COMMENT ON COLUMN jobs_db.small_repair_total IS 'Total charge for small repair work';