-- CORRECTIVE FIX: Force update jobs to point to active merged-into customers
-- First, let's identify and fix each specific case

-- Fix Barry Rickards jobs (JB2025-0012, JB2025-0018)
UPDATE jobs_db
SET customer_id = '8ba141bb-d9e5-4e53-a5b7-8ba8bb4db6c5',
    updated_at = NOW()
WHERE job_number IN ('JB2025-0012', 'JB2025-0018')
  AND customer_id = '5376ce33-ed73-4111-b3a1-a5d572da6fe6';

-- Fix Craig Williams jobs (JB2025-0024, JB2025-0025)
UPDATE jobs_db
SET customer_id = '63e112cd-2bb7-4f32-a358-864b7fc712e9',
    updated_at = NOW()
WHERE job_number IN ('JB2025-0024', 'JB2025-0025')
  AND customer_id = '61352ffd-5d0c-4720-8a57-3f79aaa634d3';

-- Now create a function to prevent this in future
CREATE OR REPLACE FUNCTION prevent_merged_customer_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the customer being assigned is merged
  IF EXISTS (
    SELECT 1 FROM customers_db 
    WHERE id = NEW.customer_id 
      AND merged_into_id IS NOT NULL
  ) THEN
    -- Get the actual customer they should point to
    SELECT merged_into_id INTO NEW.customer_id
    FROM customers_db
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to jobs_db to auto-fix merged customer assignments
DROP TRIGGER IF EXISTS trg_prevent_merged_customer ON jobs_db;
CREATE TRIGGER trg_prevent_merged_customer
  BEFORE INSERT OR UPDATE OF customer_id ON jobs_db
  FOR EACH ROW
  EXECUTE FUNCTION prevent_merged_customer_assignment();