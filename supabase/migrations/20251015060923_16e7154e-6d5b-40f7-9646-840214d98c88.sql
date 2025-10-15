
-- ============================================
-- FIX PART 1: Handle Duplicate Phone Numbers
-- ============================================

-- Add phone_digits column first (without unique constraint)
ALTER TABLE customers_db 
ADD COLUMN IF NOT EXISTS phone_digits text GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '\D', '', 'g')) STORED;

-- Find and report duplicates
DO $$
DECLARE
  v_dup_record RECORD;
  v_keep_id uuid;
  v_merge_ids uuid[];
  v_dup_count integer := 0;
  v_merge_id uuid;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DUPLICATE PHONE CLEANUP';
  RAISE NOTICE '========================================';
  
  -- For each duplicate phone_digits group
  FOR v_dup_record IN
    SELECT phone_digits, array_agg(id ORDER BY created_at) as customer_ids, count(*) as dup_count
    FROM customers_db
    WHERE is_deleted = false
      AND phone_digits != ''
    GROUP BY phone_digits
    HAVING count(*) > 1
  LOOP
    v_dup_count := v_dup_count + 1;
    
    -- Keep the oldest customer
    v_keep_id := v_dup_record.customer_ids[1];
    v_merge_ids := v_dup_record.customer_ids[2:array_length(v_dup_record.customer_ids, 1)];
    
    RAISE NOTICE 'Phone %: Keeping customer %, merging % duplicates', 
      v_dup_record.phone_digits, v_keep_id, array_length(v_merge_ids, 1);
    
    -- Update jobs to point to the kept customer
    UPDATE jobs_db
    SET customer_id = v_keep_id
    WHERE customer_id = ANY(v_merge_ids);
    
    -- Soft delete the duplicate customers
    UPDATE customers_db
    SET 
      is_deleted = true,
      merged_into_id = v_keep_id,
      updated_at = now()
    WHERE id = ANY(v_merge_ids);
    
    -- Log each merge in customer_audit
    FOREACH v_merge_id IN ARRAY v_merge_ids
    LOOP
      INSERT INTO customer_audit (
        action,
        old_customer_id,
        new_customer_id,
        merged_into_id,
        details,
        performed_by
      ) VALUES (
        'merged_duplicate',
        v_merge_id,
        v_keep_id,
        v_keep_id,
        jsonb_build_object(
          'reason', 'duplicate_phone_cleanup',
          'phone_digits', v_dup_record.phone_digits,
          'kept_customer_id', v_keep_id
        ),
        (SELECT id FROM auth.users WHERE email = 'hamptonmowerpower@gmail.com' LIMIT 1)
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DUPLICATE CLEANUP COMPLETE: % groups merged', v_dup_count;
  RAISE NOTICE '========================================';
END $$;

-- Now create the unique index (duplicates are gone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_digits_unique 
ON customers_db(phone_digits) 
WHERE is_deleted = false AND phone_digits != '';

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_customers_phone_digits ON customers_db(phone_digits);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers_db USING gin(lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db(customer_id) WHERE deleted_at IS NULL;
