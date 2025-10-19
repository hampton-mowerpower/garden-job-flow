-- Temporarily disable the slow audit trigger that's causing timeouts
DROP TRIGGER IF EXISTS audit_job_customer_changes ON jobs_db;

-- Keep the trigger function for future use but don't attach it
COMMENT ON FUNCTION log_job_customer_change() IS 'Audit function - currently disabled due to performance issues with auth.uid() causing timeouts';