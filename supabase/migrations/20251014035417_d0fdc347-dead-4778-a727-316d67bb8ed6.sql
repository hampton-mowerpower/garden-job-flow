
-- Create maintenance audit table for tracking data fixes
CREATE TABLE IF NOT EXISTS maintenance_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  description text,
  rows_affected integer,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE maintenance_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
CREATE POLICY "Admins can view maintenance audit"
  ON maintenance_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs  
CREATE POLICY "System can insert maintenance audit"
  ON maintenance_audit
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_maintenance_audit_performed_at ON maintenance_audit(performed_at DESC);
CREATE INDEX idx_maintenance_audit_table_name ON maintenance_audit(table_name);

-- Create function to log customer changes on jobs
CREATE OR REPLACE FUNCTION log_job_customer_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
    INSERT INTO maintenance_audit (
      action,
      table_name,
      description,
      rows_affected,
      performed_by,
      metadata
    ) VALUES (
      'customer_changed',
      'jobs_db',
      format('Job %s customer changed from %s to %s', NEW.job_number, OLD.customer_id, NEW.customer_id),
      1,
      auth.uid(),
      jsonb_build_object(
        'job_id', NEW.id,
        'job_number', NEW.job_number,
        'old_customer_id', OLD.customer_id,
        'new_customer_id', NEW.customer_id,
        'changed_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to jobs_db
DROP TRIGGER IF EXISTS audit_job_customer_changes ON jobs_db;
CREATE TRIGGER audit_job_customer_changes
  AFTER UPDATE ON jobs_db
  FOR EACH ROW
  EXECUTE FUNCTION log_job_customer_change();

-- Create data validation function
CREATE OR REPLACE FUNCTION validate_job_customer_links()
RETURNS TABLE(
  job_number text,
  customer_id uuid,
  issue text,
  severity text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.job_number,
    j.customer_id,
    CASE
      WHEN j.customer_id IS NULL THEN 'NULL customer_id'
      WHEN c.id IS NULL THEN 'Customer not found (deleted or invalid FK)'
      WHEN c.is_deleted = true THEN 'Customer is marked as deleted'
      ELSE 'Unknown issue'
    END as issue,
    CASE
      WHEN j.customer_id IS NULL THEN 'CRITICAL'
      WHEN c.id IS NULL THEN 'CRITICAL'
      WHEN c.is_deleted = true THEN 'WARNING'
      ELSE 'INFO'
    END as severity
  FROM jobs_db j
  LEFT JOIN customers_db c ON c.id = j.customer_id
  WHERE j.deleted_at IS NULL
    AND (
      j.customer_id IS NULL 
      OR c.id IS NULL 
      OR c.is_deleted = true
    )
  ORDER BY 
    CASE 
      WHEN j.customer_id IS NULL THEN 1
      WHEN c.id IS NULL THEN 2
      WHEN c.is_deleted = true THEN 3
      ELSE 4
    END,
    j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_job_customer_links IS 'Validates all job-customer links and returns any issues found';
