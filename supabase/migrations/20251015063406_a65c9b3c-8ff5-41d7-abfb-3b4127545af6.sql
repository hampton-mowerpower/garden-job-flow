-- FINAL DATA INTEGRITY FIXES: Role update, recovery tools, and monitoring
-- Part 1: Update user role

-- Update fonzren@gmail.com to admin role
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'fonzren@gmail.com'
  LIMIT 1;
  
  IF target_user_id IS NOT NULL THEN
    -- Update user_profiles to admin
    UPDATE public.user_profiles
    SET role = 'admin', status = 'ACTIVE'
    WHERE user_id = target_user_id;
    
    -- Ensure ADMIN role exists in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Remove COUNTER role if exists
    DELETE FROM public.user_roles
    WHERE user_id = target_user_id AND role = 'COUNTER';
    
    RAISE NOTICE 'Updated fonzren@gmail.com to admin role';
  ELSE
    RAISE NOTICE 'User fonzren@gmail.com not found';
  END IF;
END $$;

-- Part 2: Add record locking system
CREATE TABLE IF NOT EXISTS record_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  locked_by UUID NOT NULL REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_reason TEXT,
  UNIQUE(table_name, record_id)
);

ALTER TABLE record_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage locks"
  ON record_locks FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Part 3: Protected fields change log
CREATE TABLE IF NOT EXISTS protected_field_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

ALTER TABLE protected_field_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view protected field changes"
  ON protected_field_changes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert protected field changes"
  ON protected_field_changes FOR INSERT
  WITH CHECK (auth.uid() = changed_by);

-- Part 4: Create recovery staging table for JB2025-0042
CREATE TABLE IF NOT EXISTS job_recovery_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id),
  job_number TEXT NOT NULL,
  recovery_data JSONB NOT NULL,
  recovery_reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES auth.users(id)
);

ALTER TABLE job_recovery_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage job recovery"
  ON job_recovery_staging FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Part 5: Server-side computed totals function
CREATE OR REPLACE FUNCTION compute_job_totals(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parts_total NUMERIC;
  v_labour_total NUMERIC;
  v_transport_total NUMERIC;
  v_sharpen_total NUMERIC;
  v_small_repair_total NUMERIC;
  v_subtotal NUMERIC;
  v_gst NUMERIC;
  v_grand_total NUMERIC;
  v_payments_total NUMERIC;
  v_deposits_total NUMERIC;
  v_balance_due NUMERIC;
BEGIN
  -- Sum all parts
  SELECT COALESCE(SUM(total_price), 0) INTO v_parts_total
  FROM job_parts
  WHERE job_id = p_job_id;
  
  -- Get labour
  SELECT COALESCE(labour_total, 0) INTO v_labour_total
  FROM jobs_db
  WHERE id = p_job_id;
  
  -- Get transport, sharpen, small repair
  SELECT 
    COALESCE(transport_total_charge, 0),
    COALESCE(sharpen_total_charge, 0),
    COALESCE(small_repair_total, 0)
  INTO v_transport_total, v_sharpen_total, v_small_repair_total
  FROM jobs_db
  WHERE id = p_job_id;
  
  -- Calculate subtotal
  v_subtotal := v_parts_total + v_labour_total + v_transport_total + v_sharpen_total + v_small_repair_total;
  
  -- Calculate GST (10%)
  v_gst := ROUND(v_subtotal * 0.1, 2);
  
  -- Calculate grand total
  v_grand_total := v_subtotal + v_gst;
  
  -- Get payments
  SELECT COALESCE(SUM(amount), 0) INTO v_payments_total
  FROM job_payments
  WHERE job_id = p_job_id;
  
  -- Get deposits
  SELECT COALESCE(service_deposit, 0) INTO v_deposits_total
  FROM jobs_db
  WHERE id = p_job_id;
  
  -- Calculate balance
  v_balance_due := v_grand_total - v_payments_total - v_deposits_total;
  
  RETURN jsonb_build_object(
    'parts_subtotal', v_parts_total,
    'labour_total', v_labour_total,
    'transport_total', v_transport_total,
    'sharpen_total', v_sharpen_total,
    'small_repair_total', v_small_repair_total,
    'subtotal', v_subtotal,
    'gst', v_gst,
    'grand_total', v_grand_total,
    'payments_total', v_payments_total,
    'deposits_total', v_deposits_total,
    'balance_due', v_balance_due
  );
END;
$$;

-- Part 6: Shadow audit monitoring table
CREATE TABLE IF NOT EXISTS shadow_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL, -- 'customer_relink', 'total_drift', 'unauthorized_write', 'silent_deletion'
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE shadow_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shadow audit"
  ON shadow_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Part 7: Customer deterministic matching (enhanced)
CREATE OR REPLACE FUNCTION find_customer_deterministic(
  p_phone TEXT,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_suburb TEXT DEFAULT NULL
)
RETURNS TABLE(customer_id UUID, match_type TEXT, match_score INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_norm TEXT;
  v_name_norm TEXT;
  v_email_norm TEXT;
  v_match_count INTEGER;
BEGIN
  -- Normalize inputs
  v_phone_norm := digits_only(p_phone);
  v_name_norm := norm_text(p_name);
  v_email_norm := LOWER(TRIM(COALESCE(p_email, '')));
  
  -- Try exact phone match first
  SELECT COUNT(*) INTO v_match_count
  FROM customers_db
  WHERE phone_digits = v_phone_norm
    AND is_deleted = FALSE;
  
  IF v_match_count = 1 THEN
    RETURN QUERY
    SELECT c.id, 'exact_phone'::TEXT, 100
    FROM customers_db c
    WHERE c.phone_digits = v_phone_norm
      AND c.is_deleted = FALSE;
    RETURN;
  ELSIF v_match_count > 1 THEN
    -- Multiple phone matches - need name/suburb to disambiguate
    IF p_name IS NOT NULL AND p_suburb IS NOT NULL THEN
      RETURN QUERY
      SELECT c.id, 'phone_name_suburb'::TEXT, 90
      FROM customers_db c
      WHERE c.phone_digits = v_phone_norm
        AND c.name_norm = v_name_norm
        AND LOWER(c.suburb) = LOWER(p_suburb)
        AND c.is_deleted = FALSE
      LIMIT 1;
      RETURN;
    ELSE
      -- Return all matches for manual resolution
      RETURN QUERY
      SELECT c.id, 'ambiguous_phone'::TEXT, 50
      FROM customers_db c
      WHERE c.phone_digits = v_phone_norm
        AND c.is_deleted = FALSE;
      RETURN;
    END IF;
  END IF;
  
  -- Try name + email match
  IF v_name_norm != '' AND v_email_norm != '' THEN
    RETURN QUERY
    SELECT c.id, 'name_email'::TEXT, 80
    FROM customers_db c
    WHERE c.name_norm = v_name_norm
      AND c.email_norm = v_email_norm
      AND c.is_deleted = FALSE
    LIMIT 1;
    RETURN;
  END IF;
  
  -- No match found
  RETURN QUERY
  SELECT NULL::UUID, 'no_match'::TEXT, 0
  WHERE FALSE;
END;
$$;

-- Part 8: Check for record lock before update
CREATE OR REPLACE FUNCTION check_record_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked BOOLEAN;
  v_locked_by UUID;
BEGIN
  -- Check if record is locked
  SELECT TRUE, locked_by INTO v_locked, v_locked_by
  FROM record_locks
  WHERE table_name = TG_TABLE_NAME
    AND record_id = NEW.id
  LIMIT 1;
  
  IF v_locked AND v_locked_by != auth.uid() THEN
    RAISE EXCEPTION 'Record is locked by another user. Cannot modify.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply lock check to critical tables
DROP TRIGGER IF EXISTS check_job_lock ON jobs_db;
CREATE TRIGGER check_job_lock
  BEFORE UPDATE ON jobs_db
  FOR EACH ROW
  EXECUTE FUNCTION check_record_lock();

DROP TRIGGER IF EXISTS check_customer_lock ON customers_db;
CREATE TRIGGER check_customer_lock
  BEFORE UPDATE ON customers_db
  FOR EACH ROW
  EXECUTE FUNCTION check_record_lock();

-- Part 9: Add indexes for search performance
CREATE INDEX IF NOT EXISTS idx_customers_phone_digits ON customers_db(phone_digits) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_name_norm ON customers_db(name_norm) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_email_norm ON customers_db(email_norm) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs_db(job_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs_db(created_at DESC) WHERE deleted_at IS NULL;

-- Part 10: Recovery verification function
CREATE OR REPLACE FUNCTION verify_job_recovery(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_totals JSONB;
  v_computed_totals JSONB;
  v_drift BOOLEAN := FALSE;
BEGIN
  -- Get stored totals
  SELECT jsonb_build_object(
    'parts_subtotal', parts_subtotal,
    'labour_total', labour_total,
    'subtotal', subtotal,
    'gst', gst,
    'grand_total', grand_total,
    'balance_due', balance_due
  ) INTO v_stored_totals
  FROM jobs_db
  WHERE id = p_job_id;
  
  -- Get computed totals
  v_computed_totals := compute_job_totals(p_job_id);
  
  -- Check for drift
  IF ABS((v_stored_totals->>'grand_total')::NUMERIC - (v_computed_totals->>'grand_total')::NUMERIC) > 0.01 THEN
    v_drift := TRUE;
  END IF;
  
  RETURN jsonb_build_object(
    'job_id', p_job_id,
    'stored', v_stored_totals,
    'computed', v_computed_totals,
    'has_drift', v_drift,
    'verified_at', NOW()
  );
END;
$$;