-- Update normalize_name function to handle hyphens, underscores, slashes
CREATE OR REPLACE FUNCTION public.normalize_name(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(input_text)),
        '[-_/]+', ' ', 'g'
      ),
      '[^a-z0-9 ]', '', 'g'
    ),
    '\s+', ' ', 'g'
  )
$$;

-- Drop existing normalized_name columns (they're currently from triggers)
ALTER TABLE categories DROP COLUMN IF EXISTS normalized_name CASCADE;
ALTER TABLE brands DROP COLUMN IF EXISTS normalized_name CASCADE;
ALTER TABLE machinery_models DROP COLUMN IF EXISTS normalized_name CASCADE;

-- Add normalized_name as GENERATED columns
ALTER TABLE categories 
  ADD COLUMN normalized_name text 
  GENERATED ALWAYS AS (normalize_name(name)) STORED;

ALTER TABLE brands 
  ADD COLUMN normalized_name text 
  GENERATED ALWAYS AS (normalize_name(name)) STORED;

ALTER TABLE machinery_models 
  ADD COLUMN normalized_name text 
  GENERATED ALWAYS AS (normalize_name(name)) STORED;

-- ONE-TIME DEDUPLICATION: Categories
-- Merge duplicate categories (keep lowest id per normalized_name)
DO $$
DECLARE
  dup_record RECORD;
  keep_id UUID;
BEGIN
  FOR dup_record IN 
    SELECT normalized_name, array_agg(id ORDER BY id) as ids, array_agg(name ORDER BY id) as names
    FROM categories
    WHERE active = true
    GROUP BY normalized_name
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_record.ids[1];
    
    -- Update brands to point to kept category
    UPDATE brands 
    SET category_id = keep_id
    WHERE category_id = ANY(dup_record.ids[2:]);
    
    -- Update parts to use kept category name
    UPDATE parts_catalogue
    SET category = (SELECT name FROM categories WHERE id = keep_id)
    WHERE category = ANY(dup_record.names[2:]);
    
    -- Update jobs to use kept category name
    UPDATE jobs_db
    SET machine_category = (SELECT name FROM categories WHERE id = keep_id)
    WHERE machine_category = ANY(dup_record.names[2:]);
    
    -- Soft delete duplicates
    UPDATE categories
    SET active = false
    WHERE id = ANY(dup_record.ids[2:]);
    
    RAISE NOTICE 'Merged category duplicates: % → kept: % (id: %)', 
      array_to_string(dup_record.names, ', '), dup_record.names[1], keep_id;
  END LOOP;
END $$;

-- ONE-TIME DEDUPLICATION: Brands
-- Merge duplicate brands (keep lowest id per category + normalized_name)
DO $$
DECLARE
  dup_record RECORD;
  keep_id UUID;
BEGIN
  FOR dup_record IN 
    SELECT category_id, normalized_name, array_agg(id ORDER BY id) as ids, array_agg(name ORDER BY id) as names
    FROM brands
    WHERE active = true
    GROUP BY category_id, normalized_name
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_record.ids[1];
    
    -- Update models to point to kept brand
    UPDATE machinery_models 
    SET brand_id = keep_id
    WHERE brand_id = ANY(dup_record.ids[2:]);
    
    -- Update jobs to use kept brand name
    UPDATE jobs_db
    SET machine_brand = (SELECT name FROM brands WHERE id = keep_id)
    WHERE machine_brand = ANY(dup_record.names[2:]);
    
    -- Soft delete duplicates
    UPDATE brands
    SET active = false
    WHERE id = ANY(dup_record.ids[2:]);
    
    RAISE NOTICE 'Merged brand duplicates: % → kept: % (id: %)', 
      array_to_string(dup_record.names, ', '), dup_record.names[1], keep_id;
  END LOOP;
END $$;

-- ONE-TIME DEDUPLICATION: Models
-- Merge duplicate models (keep lowest id per brand + normalized_name)
DO $$
DECLARE
  dup_record RECORD;
  keep_id UUID;
BEGIN
  FOR dup_record IN 
    SELECT brand_id, normalized_name, array_agg(id ORDER BY id) as ids, array_agg(name ORDER BY id) as names
    FROM machinery_models
    WHERE active = true
    GROUP BY brand_id, normalized_name
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_record.ids[1];
    
    -- Update jobs to use kept model name
    UPDATE jobs_db
    SET machine_model = (SELECT name FROM machinery_models WHERE id = keep_id)
    WHERE machine_model = ANY(dup_record.names[2:]);
    
    -- Soft delete duplicates
    UPDATE machinery_models
    SET active = false
    WHERE id = ANY(dup_record.ids[2:]);
    
    RAISE NOTICE 'Merged model duplicates: % → kept: % (id: %)', 
      array_to_string(dup_record.names, ', '), dup_record.names[1], keep_id;
  END LOOP;
END $$;

-- Create unique indexes on normalized names
DROP INDEX IF EXISTS ux_categories_normalized_name;
CREATE UNIQUE INDEX ux_categories_normalized_name 
  ON categories(normalized_name) 
  WHERE active = true;

DROP INDEX IF EXISTS ux_brands_category_normalized_name;
CREATE UNIQUE INDEX ux_brands_category_normalized_name 
  ON brands(category_id, normalized_name) 
  WHERE active = true;

DROP INDEX IF EXISTS ux_models_brand_normalized_name;
CREATE UNIQUE INDEX ux_models_brand_normalized_name 
  ON machinery_models(brand_id, normalized_name) 
  WHERE active = true;

-- Add customer deduplication index
DROP INDEX IF EXISTS ux_customers_email_phone;
CREATE UNIQUE INDEX ux_customers_email_phone
  ON customers_db(
    COALESCE(LOWER(TRIM(email)), ''),
    COALESCE(normalized_phone, '')
  )
  WHERE is_deleted = false 
    AND merged_into_id IS NULL
    AND (email IS NOT NULL OR phone IS NOT NULL);

COMMENT ON INDEX ux_categories_normalized_name IS 'Prevents duplicate categories with same normalized name';
COMMENT ON INDEX ux_brands_category_normalized_name IS 'Prevents duplicate brands within same category';
COMMENT ON INDEX ux_models_brand_normalized_name IS 'Prevents duplicate models within same brand';
COMMENT ON INDEX ux_customers_email_phone IS 'Prevents duplicate customers with same email or phone';