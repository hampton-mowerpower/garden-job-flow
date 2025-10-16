-- Allow the mass update trigger to be bypassed for legitimate bulk operations
-- by checking for a session variable

-- Update the trigger function to check for a bypass flag
CREATE OR REPLACE FUNCTION forbid_mass_update_jobs()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_count INTEGER;
  v_bypass TEXT;
BEGIN
  -- Check if mass update bypass is enabled for this session
  BEGIN
    v_bypass := current_setting('app.allow_mass_job_updates', TRUE);
  EXCEPTION
    WHEN OTHERS THEN
      v_bypass := 'false';
  END;
  
  -- If bypass is enabled, allow the operation
  IF v_bypass = 'true' THEN
    RETURN NULL;
  END IF;
  
  -- Get the number of rows affected by this statement
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- If more than 1 row was updated, abort the transaction
  IF v_count > 1 THEN
    RAISE EXCEPTION 'SAFETY STOP: Attempted to update % jobs in one statement. Only single-job updates are allowed. To perform bulk updates, set session variable: SET LOCAL app.allow_mass_job_updates = true;', v_count
      USING HINT = 'For single job updates: WHERE id = $1. For bulk operations: SET LOCAL app.allow_mass_job_updates = true; before your update.';
  END IF;
  
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION forbid_mass_update_jobs() IS 
  'Safety trigger to prevent accidental mass updates to jobs. 
   To bypass for legitimate bulk operations:
   BEGIN;
   SET LOCAL app.allow_mass_job_updates = true;
   UPDATE jobs_db SET ... WHERE ...;
   COMMIT;';

-- Update the customer merge operations in existing code to use the bypass
COMMENT ON TABLE jobs_db IS 
  'Jobs table with safety trigger. 
   For bulk operations: SET LOCAL app.allow_mass_job_updates = true; before UPDATE.
   Example:
   BEGIN;
   SET LOCAL app.allow_mass_job_updates = true;
   UPDATE jobs_db SET customer_id = $1 WHERE customer_id = $2;
   COMMIT;';