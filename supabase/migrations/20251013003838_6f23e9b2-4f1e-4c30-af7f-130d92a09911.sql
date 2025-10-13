-- FIX MACHINE INFORMATION DUPLICATES

-- Drop existing functions
DROP FUNCTION IF EXISTS public.find_duplicate_categories();
DROP FUNCTION IF EXISTS public.find_duplicate_brands();
DROP FUNCTION IF EXISTS public.merge_categories(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.merge_brands(uuid, uuid[]);

-- 1. Normalize function
DROP FUNCTION IF EXISTS public.normalize_name(text);
CREATE OR REPLACE FUNCTION public.normalize_name(input_text text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(trim(lower(input_text)), '\s+', ' ', 'g')
$$;

-- 2. Triggers
DROP TRIGGER IF EXISTS set_normalized_name ON categories;
DROP TRIGGER IF EXISTS set_normalized_name ON brands;
CREATE OR REPLACE FUNCTION public.set_normalized_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN NEW.normalized_name := normalize_name(NEW.name); RETURN NEW; END; $function$;
CREATE TRIGGER set_normalized_name BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_normalized_name();
CREATE TRIGGER set_normalized_name BEFORE INSERT OR UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_normalized_name();

-- 3. Update existing
UPDATE categories SET normalized_name = normalize_name(name);
UPDATE brands SET normalized_name = normalize_name(name);

-- 4. Deduplicate Categories
WITH ranked AS (
  SELECT id, normalized_name, 
         FIRST_VALUE(id) OVER (PARTITION BY normalized_name ORDER BY created_at, id) as keep_id,
         ROW_NUMBER() OVER (PARTITION BY normalized_name ORDER BY created_at, id) as rn
  FROM categories WHERE active = true
)
UPDATE brands b SET category_id = r.keep_id
FROM ranked r WHERE b.category_id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY normalized_name ORDER BY created_at, id) as rn
  FROM categories WHERE active = true
)
UPDATE categories c SET active = false FROM ranked r WHERE c.id = r.id AND r.rn > 1;

-- 5. Deduplicate Brands
WITH ranked AS (
  SELECT id, category_id, normalized_name,
         FIRST_VALUE(id) OVER (PARTITION BY category_id, normalized_name ORDER BY created_at, id) as keep_id,
         ROW_NUMBER() OVER (PARTITION BY category_id, normalized_name ORDER BY created_at, id) as rn
  FROM brands WHERE active = true
)
UPDATE machinery_models m SET brand_id = r.keep_id
FROM ranked r WHERE m.brand_id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id, normalized_name ORDER BY created_at, id) as rn
  FROM brands WHERE active = true
)
UPDATE brands b SET active = false FROM ranked r WHERE b.id = r.id AND r.rn > 1;

-- 6. Unique indexes
DROP INDEX IF EXISTS categories_normalized_name_unique;
DROP INDEX IF EXISTS brands_category_normalized_name_unique;
DROP INDEX IF EXISTS brands_null_category_normalized_name_unique;
CREATE UNIQUE INDEX categories_normalized_name_unique ON categories(normalized_name) WHERE active = true;
CREATE UNIQUE INDEX brands_category_normalized_name_unique ON brands(category_id, normalized_name) WHERE active = true AND category_id IS NOT NULL;
CREATE UNIQUE INDEX brands_null_category_normalized_name_unique ON brands(normalized_name) WHERE active = true AND category_id IS NULL;

-- 7. Updated duplicate detection
CREATE OR REPLACE FUNCTION public.find_duplicate_categories() RETURNS TABLE(
  normalized_name text, category_ids uuid[], category_names text[], brand_count bigint, part_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN QUERY
  SELECT c.normalized_name, ARRAY_AGG(c.id), ARRAY_AGG(c.name),
         COUNT(DISTINCT b.id), COUNT(DISTINCT p.id)
  FROM categories c
  LEFT JOIN brands b ON b.category_id = c.id AND b.active = true
  LEFT JOIN parts_catalogue p ON p.category = c.name AND p.deleted_at IS NULL
  WHERE c.active = true GROUP BY c.normalized_name HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.find_duplicate_brands() RETURNS TABLE(
  category_id uuid, category_name text, normalized_name text, brand_ids uuid[], brand_names text[], model_count bigint
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN RETURN QUERY
  SELECT b.category_id, c.name, b.normalized_name, ARRAY_AGG(b.id), ARRAY_AGG(b.name), COUNT(DISTINCT m.id)
  FROM brands b LEFT JOIN categories c ON c.id = b.category_id
  LEFT JOIN machinery_models m ON m.brand_id = b.id AND m.active = true
  WHERE b.active = true GROUP BY b.category_id, c.name, b.normalized_name HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC;
END; $function$;

-- 8. Merge functions
CREATE OR REPLACE FUNCTION public.merge_categories(primary_id uuid, duplicate_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE p_name TEXT; t_brands INT:=0; t_parts INT:=0; dup_id UUID; d_name TEXT; rc INT;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT name INTO p_name FROM categories WHERE id=primary_id;
  IF p_name IS NULL THEN RAISE EXCEPTION 'Primary not found'; END IF;
  FOREACH dup_id IN ARRAY duplicate_ids LOOP
    SELECT name INTO d_name FROM categories WHERE id=dup_id;
    UPDATE brands SET category_id=primary_id WHERE category_id=dup_id; GET DIAGNOSTICS rc=ROW_COUNT; t_brands:=t_brands+rc;
    UPDATE parts_catalogue SET category=p_name WHERE category=d_name; GET DIAGNOSTICS rc=ROW_COUNT; t_parts:=t_parts+rc;
    UPDATE jobs_db SET machine_category=p_name WHERE machine_category=d_name;
    UPDATE categories SET active=false WHERE id=dup_id;
    INSERT INTO audit_logs(action,target_type,target_id,actor_user_id,meta)
    VALUES('merged','category',dup_id,auth.uid(),jsonb_build_object('merged_into_id',primary_id,'merged_into_name',p_name,'original_name',d_name));
  END LOOP;
  RETURN jsonb_build_object('success',true,'primary_id',primary_id,'primary_name',p_name,'merged_count',array_length(duplicate_ids,1),'affected_brands',t_brands,'affected_parts',t_parts);
END; $function$;

CREATE OR REPLACE FUNCTION public.merge_brands(primary_id uuid, duplicate_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE p_name TEXT; t_models INT:=0; t_jobs INT:=0; dup_id UUID; d_name TEXT; rc INT;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT name INTO p_name FROM brands WHERE id=primary_id;
  IF p_name IS NULL THEN RAISE EXCEPTION 'Primary not found'; END IF;
  FOREACH dup_id IN ARRAY duplicate_ids LOOP
    SELECT name INTO d_name FROM brands WHERE id=dup_id;
    UPDATE machinery_models SET brand_id=primary_id WHERE brand_id=dup_id; GET DIAGNOSTICS rc=ROW_COUNT; t_models:=t_models+rc;
    UPDATE jobs_db SET machine_brand=p_name WHERE machine_brand=d_name; GET DIAGNOSTICS rc=ROW_COUNT; t_jobs:=t_jobs+rc;
    UPDATE brands SET active=false WHERE id=dup_id;
    INSERT INTO audit_logs(action,target_type,target_id,actor_user_id,meta)
    VALUES('merged','brand',dup_id,auth.uid(),jsonb_build_object('merged_into_id',primary_id,'merged_into_name',p_name,'original_name',d_name));
  END LOOP;
  RETURN jsonb_build_object('success',true,'primary_id',primary_id,'primary_name',p_name,'merged_count',array_length(duplicate_ids,1),'affected_models',t_models,'affected_jobs',t_jobs);
END; $function$;