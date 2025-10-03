-- Remove deposit date and payment method fields from jobs_db table
ALTER TABLE jobs_db 
DROP COLUMN IF EXISTS deposit_date,
DROP COLUMN IF EXISTS deposit_method;