
-- ============================================
-- FIX PART 4: Customer Matching & Balance View
-- ============================================

-- PHASE 1: Deterministic Customer Matching
-- =========================================

CREATE OR REPLACE FUNCTION find_or_create_customer(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_address text DEFAULT '',
  p_company_name text DEFAULT NULL,
  p_customer_type customer_type DEFAULT 'domestic'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_phone_digits text;
  v_count integer;
BEGIN
  -- Normalize phone to digits only
  v_phone_digits := regexp_replace(p_phone, '\D', '', 'g');
  
  -- STEP 1: Exact phone match (most reliable)
  IF v_phone_digits != '' THEN
    SELECT id INTO v_customer_id
    FROM customers_db
    WHERE phone_digits = v_phone_digits
      AND is_deleted = false
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
      RETURN v_customer_id;
    END IF;
  END IF;
  
  -- STEP 2: Exact name + email match (case-insensitive)
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    SELECT id INTO v_customer_id
    FROM customers_db
    WHERE lower(trim(name)) = lower(trim(p_name))
      AND lower(trim(COALESCE(email, ''))) = lower(trim(p_email))
      AND is_deleted = false
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
      RETURN v_customer_id;
    END IF;
  END IF;
  
  -- STEP 3: Check for potential duplicates
  IF v_phone_digits != '' THEN
    SELECT COUNT(*) INTO v_count
    FROM customers_db
    WHERE phone_digits LIKE v_phone_digits || '%'
      AND is_deleted = false;
    
    IF v_count > 1 THEN
      RAISE EXCEPTION 'DUPLICATE_DETECTED: Multiple customers found with similar phone (%). Manual resolution required.', p_phone
        USING HINT = 'Use customer management to merge duplicates first';
    END IF;
  END IF;
  
  -- STEP 4: Create new customer (no match found)
  INSERT INTO customers_db (
    name, phone, email, address, 
    company_name, customer_type, is_deleted
  ) VALUES (
    p_name, p_phone, p_email, COALESCE(p_address, ''),
    p_company_name, p_customer_type, false
  )
  RETURNING id INTO v_customer_id;
  
  RETURN v_customer_id;
END;
$$;

-- PHASE 2: Server-Side Balance Calculation View
-- ==============================================

CREATE OR REPLACE VIEW job_calculated_totals AS
SELECT 
  j.id,
  j.job_number,
  j.grand_total as stored_grand_total,
  j.balance_due as stored_balance_due,
  j.service_deposit as stored_deposit,
  -- Recalculate from source data
  COALESCE(j.parts_subtotal, 0) + COALESCE(j.labour_total, 0) + 
    COALESCE(j.transport_total_charge, 0) + COALESCE(j.sharpen_total_charge, 0) + 
    COALESCE(j.small_repair_total, 0) - COALESCE(j.discount_value, 0) AS calculated_subtotal,
  (COALESCE(j.parts_subtotal, 0) + COALESCE(j.labour_total, 0) + 
    COALESCE(j.transport_total_charge, 0) + COALESCE(j.sharpen_total_charge, 0) + 
    COALESCE(j.small_repair_total, 0) - COALESCE(j.discount_value, 0)) * 0.1 AS calculated_gst,
  (COALESCE(j.parts_subtotal, 0) + COALESCE(j.labour_total, 0) + 
    COALESCE(j.transport_total_charge, 0) + COALESCE(j.sharpen_total_charge, 0) + 
    COALESCE(j.small_repair_total, 0) - COALESCE(j.discount_value, 0)) * 1.1 AS calculated_grand_total,
  -- Calculate balance from payments
  COALESCE(j.grand_total, 0) - COALESCE(payments_sum.total_paid, 0) AS calculated_balance_due,
  -- Flag discrepancies (> 1 cent)
  CASE 
    WHEN ABS(COALESCE(j.balance_due, 0) - (COALESCE(j.grand_total, 0) - COALESCE(payments_sum.total_paid, 0))) > 0.01 
    THEN true 
    ELSE false 
  END AS balance_mismatch,
  CASE 
    WHEN ABS(COALESCE(j.grand_total, 0) - ((COALESCE(j.parts_subtotal, 0) + COALESCE(j.labour_total, 0) + 
      COALESCE(j.transport_total_charge, 0) + COALESCE(j.sharpen_total_charge, 0) + 
      COALESCE(j.small_repair_total, 0) - COALESCE(j.discount_value, 0)) * 1.1)) > 0.01 
    THEN true 
    ELSE false 
  END AS total_mismatch,
  payments_sum.total_paid,
  payments_sum.payment_count,
  parts_sum.parts_count,
  parts_sum.parts_total
FROM jobs_db j
LEFT JOIN (
  SELECT 
    job_id,
    SUM(amount) as total_paid,
    COUNT(*) as payment_count
  FROM job_payments
  GROUP BY job_id
) payments_sum ON payments_sum.job_id = j.id
LEFT JOIN (
  SELECT 
    job_id,
    COUNT(*) as parts_count,
    SUM(total_price) as parts_total
  FROM job_parts
  GROUP BY job_id
) parts_sum ON parts_sum.job_id = j.id
WHERE j.deleted_at IS NULL;

-- Grant access to view
GRANT SELECT ON job_calculated_totals TO authenticated;

-- PHASE 3: Forensic Functions for Investigation
-- ==============================================

-- Find jobs with calculation discrepancies
CREATE OR REPLACE FUNCTION find_jobs_with_calculation_errors()
RETURNS TABLE(
  job_number text,
  stored_total numeric,
  calculated_total numeric,
  difference numeric,
  stored_balance numeric,
  calculated_balance numeric,
  balance_diff numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    job_number,
    stored_grand_total,
    calculated_grand_total,
    stored_grand_total - calculated_grand_total AS difference,
    stored_balance_due,
    calculated_balance_due,
    stored_balance_due - calculated_balance_due AS balance_diff
  FROM job_calculated_totals
  WHERE balance_mismatch = true OR total_mismatch = true
  ORDER BY ABS(stored_grand_total - calculated_grand_total) DESC;
$$;

-- Find recent unauthorized customer changes
CREATE OR REPLACE FUNCTION find_suspicious_customer_changes(days integer DEFAULT 30)
RETURNS TABLE(
  job_number text,
  old_customer text,
  new_customer text,
  changed_at timestamptz,
  changed_by_user text,
  change_reason text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cca.job_number,
    cca.old_customer_name || ' (' || cca.old_customer_phone || ')' AS old_customer,
    cca.new_customer_name || ' (' || cca.new_customer_phone || ')' AS new_customer,
    cca.changed_at,
    COALESCE(up.full_name, 'System') AS changed_by_user,
    cca.change_reason
  FROM customer_change_audit cca
  LEFT JOIN user_profiles up ON up.user_id = cca.changed_by
  WHERE cca.changed_at > now() - (days || ' days')::interval
    AND cca.change_reason NOT LIKE '%RECOVERY%'
  ORDER BY cca.changed_at DESC;
$$;
