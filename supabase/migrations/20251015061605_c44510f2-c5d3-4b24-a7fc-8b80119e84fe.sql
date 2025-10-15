
-- ============================================
-- FIX PART 3: Validation & Concurrency Control
-- ============================================

-- PHASE 1: Validation Triggers (replaces CHECK constraints)
-- ==========================================================

CREATE OR REPLACE FUNCTION validate_job_parts_positive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative: %', NEW.quantity;
  END IF;
  IF NEW.unit_price < 0 THEN
    RAISE EXCEPTION 'Unit price cannot be negative: %', NEW.unit_price;
  END IF;
  IF NEW.total_price < 0 THEN
    RAISE EXCEPTION 'Total price cannot be negative: %', NEW.total_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS validate_job_parts_before_write ON job_parts;
CREATE TRIGGER validate_job_parts_before_write
BEFORE INSERT OR UPDATE ON job_parts
FOR EACH ROW
EXECUTE FUNCTION validate_job_parts_positive();

-- PHASE 2: Optimistic Concurrency Control
-- ========================================

-- Ensure version columns exist and are populated
UPDATE jobs_db SET version = 1 WHERE version IS NULL;
UPDATE customers_db SET version = 1 WHERE version IS NULL;

-- Create optimistic lock validation function
CREATE OR REPLACE FUNCTION check_optimistic_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Version must increment by exactly 1
    IF OLD.version IS DISTINCT FROM (NEW.version - 1) THEN
      RAISE EXCEPTION 'Optimistic lock failed: Record modified by another user (expected v%, found v%)', 
        NEW.version - 1, OLD.version
        USING ERRCODE = '40001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Apply optimistic locking triggers
DROP TRIGGER IF EXISTS check_job_version ON jobs_db;
CREATE TRIGGER check_job_version
BEFORE UPDATE ON jobs_db
FOR EACH ROW
EXECUTE FUNCTION check_optimistic_lock();

DROP TRIGGER IF EXISTS check_customer_version ON customers_db;
CREATE TRIGGER check_customer_version
BEFORE UPDATE ON customers_db
FOR EACH ROW
EXECUTE FUNCTION check_optimistic_lock();

-- PHASE 3: Enhanced Audit for Parts (critical for tracking deletions)
-- ====================================================================

CREATE OR REPLACE FUNCTION audit_job_parts_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      table_name, record_id, operation,
      old_values, changed_by, source
    ) VALUES (
      'job_parts',
      OLD.id::TEXT,
      'DELETE',
      to_jsonb(OLD),
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      table_name, record_id, operation,
      new_values, changed_by, source
    ) VALUES (
      'job_parts',
      NEW.id::TEXT,
      'INSERT',
      to_jsonb(NEW),
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      table_name, record_id, operation,
      old_values, new_values,
      changed_by, source
    ) VALUES (
      'job_parts',
      NEW.id::TEXT,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS audit_job_parts_trigger ON job_parts;
CREATE TRIGGER audit_job_parts_trigger
AFTER INSERT OR UPDATE OR DELETE ON job_parts
FOR EACH ROW
EXECUTE FUNCTION audit_job_parts_changes();
