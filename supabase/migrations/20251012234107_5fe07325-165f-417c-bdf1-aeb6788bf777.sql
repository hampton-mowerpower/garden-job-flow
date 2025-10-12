-- Part A: Add normalized_name columns and indexes for duplicate prevention
ALTER TABLE categories ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE machinery_models ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Create function to normalize names (trim, lowercase, single spaces)
CREATE OR REPLACE FUNCTION normalize_name(input_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(input_name, '\s+', ' ', 'g')));
END;
$$;

-- Create trigger function to auto-populate normalized_name
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.normalized_name := normalize_name(NEW.name);
  RETURN NEW;
END;
$$;

-- Create triggers for auto-normalization
DROP TRIGGER IF EXISTS categories_normalize_name ON categories;
CREATE TRIGGER categories_normalize_name
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_normalized_name();

DROP TRIGGER IF EXISTS brands_normalize_name ON brands;
CREATE TRIGGER brands_normalize_name
  BEFORE INSERT OR UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION set_normalized_name();

DROP TRIGGER IF EXISTS models_normalize_name ON machinery_models;
CREATE TRIGGER models_normalize_name
  BEFORE INSERT OR UPDATE ON machinery_models
  FOR EACH ROW
  EXECUTE FUNCTION set_normalized_name();

-- Populate normalized_name for existing records
UPDATE categories SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL;
UPDATE brands SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL;
UPDATE machinery_models SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL;

-- Create unique indexes to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_normalized_name_unique 
  ON categories(normalized_name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_normalized_name_category_unique 
  ON brands(category_id, normalized_name) WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_models_normalized_name_brand_unique 
  ON machinery_models(brand_id, normalized_name) WHERE active = true;

-- Part B: Functions for duplicate detection and merging

-- Function to find duplicate categories
CREATE OR REPLACE FUNCTION find_duplicate_categories()
RETURNS TABLE(
  normalized_name TEXT,
  category_ids UUID[],
  category_names TEXT[],
  job_count BIGINT,
  part_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.normalized_name,
    ARRAY_AGG(c.id) as category_ids,
    ARRAY_AGG(c.name) as category_names,
    COUNT(DISTINCT j.id) as job_count,
    COUNT(DISTINCT p.id) as part_count
  FROM categories c
  LEFT JOIN jobs_db j ON j.machine_category = c.name
  LEFT JOIN parts_catalogue p ON p.category = c.name
  WHERE c.active = true
  GROUP BY c.normalized_name
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Function to find duplicate brands
CREATE OR REPLACE FUNCTION find_duplicate_brands()
RETURNS TABLE(
  category_id UUID,
  normalized_name TEXT,
  brand_ids UUID[],
  brand_names TEXT[],
  job_count BIGINT,
  model_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.category_id,
    b.normalized_name,
    ARRAY_AGG(b.id) as brand_ids,
    ARRAY_AGG(b.name) as brand_names,
    COUNT(DISTINCT j.id) as job_count,
    COUNT(DISTINCT m.id) as model_count
  FROM brands b
  LEFT JOIN jobs_db j ON j.machine_brand = b.name
  LEFT JOIN machinery_models m ON m.brand_id = b.id
  WHERE b.active = true
  GROUP BY b.category_id, b.normalized_name
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Function to merge categories (admin only)
CREATE OR REPLACE FUNCTION merge_categories(
  primary_id UUID,
  duplicate_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_name TEXT;
  total_jobs INT := 0;
  total_parts INT := 0;
  duplicate_id UUID;
  dup_name TEXT;
  row_count_var INT;
BEGIN
  -- Check admin permission
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get primary category name
  SELECT name INTO primary_name FROM categories WHERE id = primary_id;
  IF primary_name IS NULL THEN
    RAISE EXCEPTION 'Primary category not found';
  END IF;

  -- For each duplicate, reassign references
  FOREACH duplicate_id IN ARRAY duplicate_ids
  LOOP
    SELECT name INTO dup_name FROM categories WHERE id = duplicate_id;
    
    -- Update jobs
    UPDATE jobs_db 
    SET machine_category = primary_name 
    WHERE machine_category = dup_name;
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    total_jobs := total_jobs + row_count_var;
    
    -- Update parts
    UPDATE parts_catalogue 
    SET category = primary_name 
    WHERE category = dup_name;
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    total_parts := total_parts + row_count_var;
    
    -- Soft delete duplicate
    UPDATE categories 
    SET active = false 
    WHERE id = duplicate_id;
    
    -- Log audit
    INSERT INTO audit_logs (action, target_type, target_id, actor_user_id, meta)
    VALUES (
      'merged',
      'category',
      duplicate_id,
      auth.uid(),
      jsonb_build_object(
        'merged_into_id', primary_id,
        'merged_into_name', primary_name,
        'original_name', dup_name
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'primary_id', primary_id,
    'primary_name', primary_name,
    'merged_count', array_length(duplicate_ids, 1),
    'affected_jobs', total_jobs,
    'affected_parts', total_parts
  );
END;
$$;

-- Function to merge brands (admin only)
CREATE OR REPLACE FUNCTION merge_brands(
  primary_id UUID,
  duplicate_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_name TEXT;
  total_jobs INT := 0;
  total_models INT := 0;
  duplicate_id UUID;
  dup_name TEXT;
  row_count_var INT;
BEGIN
  -- Check admin permission
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get primary brand name
  SELECT name INTO primary_name FROM brands WHERE id = primary_id;
  IF primary_name IS NULL THEN
    RAISE EXCEPTION 'Primary brand not found';
  END IF;

  -- For each duplicate, reassign references
  FOREACH duplicate_id IN ARRAY duplicate_ids
  LOOP
    SELECT name INTO dup_name FROM brands WHERE id = duplicate_id;
    
    -- Update jobs
    UPDATE jobs_db 
    SET machine_brand = primary_name 
    WHERE machine_brand = dup_name;
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    total_jobs := total_jobs + row_count_var;
    
    -- Update models (reassign to primary brand)
    UPDATE machinery_models 
    SET brand_id = primary_id 
    WHERE brand_id = duplicate_id;
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    total_models := total_models + row_count_var;
    
    -- Soft delete duplicate
    UPDATE brands 
    SET active = false 
    WHERE id = duplicate_id;
    
    -- Log audit
    INSERT INTO audit_logs (action, target_type, target_id, actor_user_id, meta)
    VALUES (
      'merged',
      'brand',
      duplicate_id,
      auth.uid(),
      jsonb_build_object(
        'merged_into_id', primary_id,
        'merged_into_name', primary_name,
        'original_name', dup_name
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'primary_id', primary_id,
    'primary_name', primary_name,
    'merged_count', array_length(duplicate_ids, 1),
    'affected_jobs', total_jobs,
    'affected_models', total_models
  );
END;
$$;

-- Function to get reference counts for safe deletion
CREATE OR REPLACE FUNCTION get_category_reference_count(category_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat_name TEXT;
  job_count BIGINT;
  part_count BIGINT;
BEGIN
  SELECT name INTO cat_name FROM categories WHERE id = category_id;
  
  SELECT COUNT(*) INTO job_count 
  FROM jobs_db 
  WHERE machine_category = cat_name;
  
  SELECT COUNT(*) INTO part_count 
  FROM parts_catalogue 
  WHERE category = cat_name;
  
  RETURN jsonb_build_object(
    'category_id', category_id,
    'category_name', cat_name,
    'job_count', job_count,
    'part_count', part_count,
    'can_delete', (job_count = 0 AND part_count = 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_brand_reference_count(brand_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_name TEXT;
  job_count BIGINT;
  model_count BIGINT;
BEGIN
  SELECT name INTO brand_name FROM brands WHERE id = brand_id;
  
  SELECT COUNT(*) INTO job_count 
  FROM jobs_db 
  WHERE machine_brand = brand_name;
  
  SELECT COUNT(*) INTO model_count 
  FROM machinery_models 
  WHERE brand_id = brand_id;
  
  RETURN jsonb_build_object(
    'brand_id', brand_id,
    'brand_name', brand_name,
    'job_count', job_count,
    'model_count', model_count,
    'can_delete', (job_count = 0 AND model_count = 0)
  );
END;
$$;