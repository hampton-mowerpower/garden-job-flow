-- =====================================================
-- Deduplicate customers BEFORE creating unique indexes
-- =====================================================

-- First, ensure normalized fields are populated
UPDATE public.customers_db 
SET normalized_email = LOWER(TRIM(COALESCE(email, ''))),
    normalized_phone = REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')
WHERE normalized_email IS NULL OR normalized_phone IS NULL 
  OR normalized_email = '' OR normalized_phone = '';

-- Merge duplicate customers by email (keep oldest, merge newer ones)
WITH duplicates AS (
  SELECT 
    normalized_email,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.customers_db
  WHERE is_deleted = false 
    AND merged_into_id IS NULL
    AND normalized_email IS NOT NULL 
    AND normalized_email != ''
  GROUP BY normalized_email
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS merge_ids
  FROM duplicates
)
UPDATE public.customers_db c
SET 
  is_deleted = true,
  merged_into_id = kf.keep_id,
  updated_at = now()
FROM keep_first kf
WHERE c.id = ANY(kf.merge_ids);

-- Update jobs_db to point to kept customers
WITH duplicates AS (
  SELECT 
    normalized_email,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.customers_db
  WHERE normalized_email IS NOT NULL 
    AND normalized_email != ''
  GROUP BY normalized_email
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS merge_ids
  FROM duplicates
)
UPDATE public.jobs_db j
SET customer_id = kf.keep_id
FROM keep_first kf
WHERE j.customer_id = ANY(kf.merge_ids);

-- Merge duplicate customers by phone (only non-merged ones)
WITH duplicates AS (
  SELECT 
    normalized_phone,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.customers_db
  WHERE is_deleted = false 
    AND merged_into_id IS NULL
    AND normalized_phone IS NOT NULL 
    AND normalized_phone != ''
  GROUP BY normalized_phone
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS merge_ids
  FROM duplicates
)
UPDATE public.customers_db c
SET 
  is_deleted = true,
  merged_into_id = kf.keep_id,
  updated_at = now()
FROM keep_first kf
WHERE c.id = ANY(kf.merge_ids);

-- Update jobs_db to point to kept customers (phone)
WITH duplicates AS (
  SELECT 
    normalized_phone,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.customers_db
  WHERE normalized_phone IS NOT NULL 
    AND normalized_phone != ''
  GROUP BY normalized_phone
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS merge_ids
  FROM duplicates
)
UPDATE public.jobs_db j
SET customer_id = kf.keep_id
FROM keep_first kf
WHERE j.customer_id = ANY(kf.merge_ids);

-- Now create unique partial indexes (only after deduplication)
DROP INDEX IF EXISTS unique_customer_email;
CREATE UNIQUE INDEX unique_customer_email 
  ON public.customers_db(normalized_email) 
  WHERE is_deleted = false 
    AND merged_into_id IS NULL 
    AND normalized_email IS NOT NULL 
    AND normalized_email != '';

DROP INDEX IF EXISTS unique_customer_phone;
CREATE UNIQUE INDEX unique_customer_phone 
  ON public.customers_db(normalized_phone) 
  WHERE is_deleted = false 
    AND merged_into_id IS NULL 
    AND normalized_phone IS NOT NULL 
    AND normalized_phone != '';