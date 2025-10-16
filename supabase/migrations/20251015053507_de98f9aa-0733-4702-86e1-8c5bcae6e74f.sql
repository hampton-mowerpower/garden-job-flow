-- Fix Job 0065 - restore Lindsay James customer and add comprehensive logging
-- Part 1: Create Lindsay James customer if not exists
INSERT INTO customers_db (
  id,
  name,
  phone,
  address,
  is_deleted,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Lindsay James',
  '0403164291',
  '',
  false,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM customers_db 
  WHERE (name ILIKE '%lindsay%james%' OR phone LIKE '%0403164291%')
    AND is_deleted = false
);

-- Part 2: Relink Job 0065 to Lindsay James
DO $$
DECLARE
  lindsay_id UUID;
  job_id UUID;
  old_cust_id UUID;
  old_cust_name TEXT;
  old_cust_phone TEXT;
BEGIN
  -- Find Lindsay James customer
  SELECT id INTO lindsay_id
  FROM customers_db
  WHERE (name ILIKE '%lindsay%james%' OR phone LIKE '%0403164291%')
    AND is_deleted = false
  ORDER BY created_at DESC
  LIMIT 1;

  -- Find Job 0065 and its current customer
  SELECT id, customer_id INTO job_id, old_cust_id
  FROM jobs_db
  WHERE job_number = 'JB2025-0065'
  LIMIT 1;

  IF lindsay_id IS NOT NULL AND job_id IS NOT NULL THEN
    -- Get old customer details
    SELECT name, phone INTO old_cust_name, old_cust_phone
    FROM customers_db
    WHERE id = old_cust_id;

    -- Update job to link to Lindsay James
    UPDATE jobs_db
    SET customer_id = lindsay_id,
        updated_at = now(),
        version = version + 1
    WHERE id = job_id;

    -- Log the recovery in customer_change_audit
    INSERT INTO customer_change_audit (
      id,
      job_id,
      job_number,
      old_customer_id,
      old_customer_name,
      old_customer_phone,
      new_customer_id,
      new_customer_name,
      new_customer_phone,
      changed_at,
      change_reason
    ) VALUES (
      gen_random_uuid(),
      job_id,
      'JB2025-0065',
      old_cust_id,
      old_cust_name,
      old_cust_phone,
      lindsay_id,
      'Lindsay James',
      '0403164291',
      now(),
      'SYSTEM RECOVERY: Restored Lindsay James customer link from audit trail (Data Loss Fix)'
    );

    RAISE NOTICE 'Successfully recovered Lindsay James (ID: %) and relinked Job 0065 (was linked to: %)', lindsay_id, old_cust_name;
  ELSE
    IF lindsay_id IS NULL THEN
      RAISE NOTICE 'Could not find or create Lindsay James customer';
    END IF;
    IF job_id IS NULL THEN
      RAISE NOTICE 'Could not find Job 0065';
    END IF;
  END IF;
END $$;

-- Part 3: Enhanced customer link logging trigger
CREATE OR REPLACE FUNCTION log_customer_link_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
    INSERT INTO customer_change_audit (
      id,
      job_id,
      job_number,
      old_customer_id,
      old_customer_name,
      old_customer_phone,
      new_customer_id,
      new_customer_name,
      new_customer_phone,
      changed_at,
      changed_by,
      change_reason
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.job_number,
      OLD.customer_id,
      (SELECT name FROM customers_db WHERE id = OLD.customer_id),
      (SELECT phone FROM customers_db WHERE id = OLD.customer_id),
      NEW.customer_id,
      (SELECT name FROM customers_db WHERE id = NEW.customer_id),
      (SELECT phone FROM customers_db WHERE id = NEW.customer_id),
      now(),
      auth.uid(),
      COALESCE(current_setting('app.change_reason', true), 'Automated customer link change')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_job_customer_changes ON jobs_db;

CREATE TRIGGER log_job_customer_changes
  AFTER UPDATE OF customer_id ON jobs_db
  FOR EACH ROW
  WHEN (OLD.customer_id IS DISTINCT FROM NEW.customer_id)
  EXECUTE FUNCTION log_customer_link_changes();

-- Part 4: Trigger to prevent linking to deleted customers
CREATE OR REPLACE FUNCTION prevent_deleted_customer_link()
RETURNS TRIGGER AS $$
DECLARE
  is_deleted_customer BOOLEAN;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    SELECT is_deleted INTO is_deleted_customer
    FROM customers_db
    WHERE id = NEW.customer_id;

    IF is_deleted_customer = true THEN
      RAISE EXCEPTION 'Cannot link job to deleted customer (customer_id: %)', NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_customer_not_deleted ON jobs_db;

CREATE TRIGGER check_customer_not_deleted
  BEFORE INSERT OR UPDATE OF customer_id ON jobs_db
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION prevent_deleted_customer_link();

COMMENT ON FUNCTION log_customer_link_changes() IS 
  'Logs all customer_id changes in jobs_db to customer_change_audit for forensic tracking';

COMMENT ON FUNCTION prevent_deleted_customer_link() IS 
  'Prevents linking jobs to deleted customers to maintain data integrity';