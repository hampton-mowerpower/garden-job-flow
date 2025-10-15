-- CRITICAL DATA LOSS PREVENTION - Emergency Fixes
-- Phase 1: Comprehensive Audit System for Jobs

-- 1. Enhanced audit log table (if not exists with all required fields)
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[], -- array of field names that changed
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  client_ip INET,
  user_agent TEXT,
  request_id TEXT,
  source TEXT -- 'ui', 'api', 'worker', 'migration'
);

CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_time ON audit_log(table_name, changed_at DESC);

-- 2. Add version control to critical tables
ALTER TABLE jobs_db ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Initialize version for existing records
UPDATE jobs_db SET version = 1 WHERE version IS NULL;
UPDATE customers_db SET version = 1 WHERE version IS NULL;

-- 3. Version increment trigger
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_version_trigger ON jobs_db;
CREATE TRIGGER jobs_version_trigger
  BEFORE UPDATE ON jobs_db
  FOR EACH ROW EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS customers_version_trigger ON customers_db;
CREATE TRIGGER customers_version_trigger
  BEFORE UPDATE ON customers_db
  FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 4. Comprehensive audit trigger for jobs
CREATE OR REPLACE FUNCTION audit_jobs_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_array TEXT[];
  field_name TEXT;
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_json := row_to_json(OLD)::JSONB;
    new_json := row_to_json(NEW)::JSONB;
    
    -- Find changed fields
    SELECT ARRAY_AGG(key) INTO changed_fields_array
    FROM jsonb_each(new_json)
    WHERE new_json->>key IS DISTINCT FROM old_json->>key
      AND key NOT IN ('updated_at', 'version'); -- Exclude auto-updated fields
    
    INSERT INTO audit_log (
      table_name, record_id, operation, 
      old_values, new_values, changed_fields, changed_by, source
    )
    VALUES (
      'jobs_db',
      NEW.id::TEXT,
      'UPDATE',
      old_json,
      new_json,
      changed_fields_array,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_values, changed_by, source)
    VALUES (
      'jobs_db',
      OLD.id::TEXT,
      'DELETE',
      row_to_json(OLD)::JSONB,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, operation, new_values, changed_by, source)
    VALUES (
      'jobs_db',
      NEW.id::TEXT,
      'INSERT',
      row_to_json(NEW)::JSONB,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_audit_trigger ON jobs_db;
CREATE TRIGGER jobs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON jobs_db
  FOR EACH ROW EXECUTE FUNCTION audit_jobs_changes();

-- 5. Audit trigger for customers
CREATE OR REPLACE FUNCTION audit_customers_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_array TEXT[];
  old_json JSONB;
  new_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_json := row_to_json(OLD)::JSONB;
    new_json := row_to_json(NEW)::JSONB;
    
    SELECT ARRAY_AGG(key) INTO changed_fields_array
    FROM jsonb_each(new_json)
    WHERE new_json->>key IS DISTINCT FROM old_json->>key
      AND key NOT IN ('updated_at', 'version');
    
    INSERT INTO audit_log (
      table_name, record_id, operation, 
      old_values, new_values, changed_fields, changed_by, source
    )
    VALUES (
      'customers_db',
      NEW.id::TEXT,
      'UPDATE',
      old_json,
      new_json,
      changed_fields_array,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_values, changed_by, source)
    VALUES (
      'customers_db',
      OLD.id::TEXT,
      'DELETE',
      row_to_json(OLD)::JSONB,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, operation, new_values, changed_by, source)
    VALUES (
      'customers_db',
      NEW.id::TEXT,
      'INSERT',
      row_to_json(NEW)::JSONB,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      COALESCE(current_setting('app.source', true), 'unknown')
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_audit_trigger ON customers_db;
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers_db
  FOR EACH ROW EXECUTE FUNCTION audit_customers_changes();

-- 6. Alert trigger for NULL overwrites
CREATE OR REPLACE FUNCTION detect_null_overwrites()
RETURNS TRIGGER AS $$
DECLARE
  critical_nulls TEXT[];
BEGIN
  critical_nulls := ARRAY[]::TEXT[];
  
  -- Check critical fields that should never be nullified
  IF OLD.customer_id IS NOT NULL AND NEW.customer_id IS NULL THEN
    critical_nulls := array_append(critical_nulls, 'customer_id');
  END IF;
  IF OLD.job_number IS NOT NULL AND NEW.job_number IS NULL THEN
    critical_nulls := array_append(critical_nulls, 'job_number');
  END IF;
  IF OLD.grand_total IS NOT NULL AND NEW.grand_total IS NULL THEN
    critical_nulls := array_append(critical_nulls, 'grand_total');
  END IF;
  IF OLD.machine_category IS NOT NULL AND NEW.machine_category IS NULL THEN
    critical_nulls := array_append(critical_nulls, 'machine_category');
  END IF;
  
  IF array_length(critical_nulls, 1) > 0 THEN
    -- Log to audit with special marker
    INSERT INTO audit_log (
      table_name, record_id, operation, 
      old_values, new_values, changed_fields, changed_by, source
    )
    VALUES (
      'jobs_db',
      NEW.id::TEXT,
      'NULL_OVERWRITE_ALERT',
      row_to_json(OLD)::JSONB,
      row_to_json(NEW)::JSONB,
      critical_nulls,
      COALESCE(current_setting('app.current_user', true), auth.uid()::TEXT, 'system'),
      'data_loss_alert'
    );
    
    -- Send notification (would need pg_notify set up)
    PERFORM pg_notify(
      'data_loss_alert',
      json_build_object(
        'table', 'jobs_db',
        'record_id', NEW.id,
        'job_number', OLD.job_number,
        'fields_nullified', critical_nulls,
        'timestamp', NOW()
      )::TEXT
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detect_null_overwrites_jobs ON jobs_db;
CREATE TRIGGER detect_null_overwrites_jobs
  BEFORE UPDATE ON jobs_db
  FOR EACH ROW EXECUTE FUNCTION detect_null_overwrites();

-- 7. RLS policies for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all audit logs"
ON audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "System can insert audit logs"
ON audit_log FOR INSERT
WITH CHECK (true);

-- 8. Add NOT NULL constraints to critical fields
-- Note: We'll be careful not to break existing data

-- Jobs table - ensure critical fields are never NULL
-- (We'll add these gradually to avoid breaking existing records)
-- First update any NULL values to defaults
UPDATE jobs_db SET job_number = 'MISSING' WHERE job_number IS NULL;
UPDATE jobs_db SET status = 'pending' WHERE status IS NULL;
UPDATE jobs_db SET problem_description = 'No description' WHERE problem_description IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE jobs_db ALTER COLUMN job_number SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN status SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN customer_id SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN machine_category SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN machine_brand SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN machine_model SET NOT NULL;
ALTER TABLE jobs_db ALTER COLUMN problem_description SET NOT NULL;

-- Customers table
UPDATE customers_db SET name = 'Unknown' WHERE name IS NULL;
UPDATE customers_db SET phone = '0000000000' WHERE phone IS NULL;
UPDATE customers_db SET address = '' WHERE address IS NULL;

ALTER TABLE customers_db ALTER COLUMN name SET NOT NULL;
ALTER TABLE customers_db ALTER COLUMN phone SET NOT NULL;
ALTER TABLE customers_db ALTER COLUMN address SET NOT NULL;

-- 9. Create forensic query functions
CREATE OR REPLACE FUNCTION get_null_overwrites(days INTEGER DEFAULT 30)
RETURNS TABLE (
  table_name TEXT,
  record_id TEXT,
  fields_nullified TEXT[],
  changed_at TIMESTAMP,
  changed_by TEXT,
  job_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.table_name,
    a.record_id,
    a.changed_fields,
    a.changed_at,
    a.changed_by,
    a.old_values->>'job_number' as job_number
  FROM audit_log a
  WHERE a.operation = 'NULL_OVERWRITE_ALERT'
    AND a.changed_at > NOW() - (days || ' days')::INTERVAL
  ORDER BY a.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_job_audit_trail(p_job_id TEXT)
RETURNS TABLE (
  operation TEXT,
  changed_at TIMESTAMP,
  changed_by TEXT,
  changed_fields TEXT[],
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.operation,
    a.changed_at,
    a.changed_by,
    a.changed_fields,
    a.old_values,
    a.new_values
  FROM audit_log a
  WHERE a.table_name = 'jobs_db'
    AND a.record_id = p_job_id
  ORDER BY a.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_rapid_changes(minutes INTEGER DEFAULT 5, threshold INTEGER DEFAULT 5)
RETURNS TABLE (
  table_name TEXT,
  record_id TEXT,
  change_count BIGINT,
  first_change TIMESTAMP,
  last_change TIMESTAMP,
  time_span INTERVAL,
  job_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.table_name,
    a.record_id,
    COUNT(*) as change_count,
    MIN(a.changed_at) as first_change,
    MAX(a.changed_at) as last_change,
    MAX(a.changed_at) - MIN(a.changed_at) as time_span,
    (SELECT old_values->>'job_number' FROM audit_log WHERE record_id = a.record_id AND table_name = 'jobs_db' LIMIT 1) as job_number
  FROM audit_log a
  WHERE a.changed_at > NOW() - INTERVAL '7 days'
    AND a.operation IN ('UPDATE', 'INSERT')
  GROUP BY a.table_name, a.record_id
  HAVING COUNT(*) >= threshold 
    AND (MAX(a.changed_at) - MIN(a.changed_at)) < (minutes || ' minutes')::INTERVAL
  ORDER BY change_count DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;