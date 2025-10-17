
-- FIX 1: Fix the user_roles table to have lowercase 'admin'
-- user_roles uses app_role enum which has: admin, manager, technician, clerk, cashier
UPDATE user_roles 
SET role = 'admin'::app_role
WHERE UPPER(role::text) = 'ADMIN';

-- FIX 2: Remove duplicate/conflicting RLS policies on parts_catalogue
DROP POLICY IF EXISTS "Authenticated users can insert parts" ON parts_catalogue;
DROP POLICY IF EXISTS "Authenticated users can update parts" ON parts_catalogue;

-- FIX 3: Add performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_customer_status ON jobs_db(customer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs_db(updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone_active ON customers_db(phone) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_job_parts_job_id ON job_parts(job_id) WHERE TRUE;
CREATE INDEX IF NOT EXISTS idx_job_parts_part_id ON job_parts(part_id) WHERE part_id IS NOT NULL;

-- FIX 4: Add error logging table for debugging save issues
CREATE TABLE IF NOT EXISTS public.save_error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  operation text NOT NULL,
  error_message text,
  error_code text,
  attempted_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE save_error_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view error logs" ON save_error_log;
DROP POLICY IF EXISTS "System can insert error logs" ON save_error_log;

CREATE POLICY "Admins can view error logs"
  ON save_error_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND LOWER(ur.role::text) = 'admin'
    )
  );

CREATE POLICY "System can insert error logs"
  ON save_error_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- FIX 5: Verify all authenticated users can save jobs
-- Add a comment to document the intent
COMMENT ON TABLE jobs_db IS 'All authenticated users can view, insert, and update jobs. Admin role required for deletion.';
