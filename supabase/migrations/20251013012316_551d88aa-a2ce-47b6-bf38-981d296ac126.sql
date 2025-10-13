-- =====================================================
-- PART 1: Add normalized_name columns and triggers
-- =====================================================

-- Add normalized_name to categories if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'normalized_name'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN normalized_name TEXT;
  END IF;
END $$;

-- Add normalized_name to brands if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND column_name = 'normalized_name'
  ) THEN
    ALTER TABLE public.brands ADD COLUMN normalized_name TEXT;
  END IF;
END $$;

-- Add normalized_name to machinery_models if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'machinery_models' 
    AND column_name = 'normalized_name'
  ) THEN
    ALTER TABLE public.machinery_models ADD COLUMN normalized_name TEXT;
  END IF;
END $$;

-- Normalization function (already exists, ensuring it's correct)
CREATE OR REPLACE FUNCTION public.normalize_name(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      lower(trim(input_text)), 
      '[^a-z0-9]', ' ', 'g'
    ), 
    '\s+', ' ', 'g'
  )
$$;

-- Update existing normalized_name values
UPDATE public.categories SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL OR normalized_name = '';
UPDATE public.brands SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL OR normalized_name = '';
UPDATE public.machinery_models SET normalized_name = normalize_name(name) WHERE normalized_name IS NULL OR normalized_name = '';

-- Trigger function to auto-set normalized_name
CREATE OR REPLACE FUNCTION public.set_normalized_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.normalized_name := normalize_name(NEW.name);
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_category_normalized_name ON public.categories;
DROP TRIGGER IF EXISTS set_brand_normalized_name ON public.brands;
DROP TRIGGER IF EXISTS set_model_normalized_name ON public.machinery_models;

-- Create triggers for auto-normalization
CREATE TRIGGER set_category_normalized_name
  BEFORE INSERT OR UPDATE OF name ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_name();

CREATE TRIGGER set_brand_normalized_name
  BEFORE INSERT OR UPDATE OF name ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_name();

CREATE TRIGGER set_model_normalized_name
  BEFORE INSERT OR UPDATE OF name ON public.machinery_models
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_name();

-- =====================================================
-- PART 2: Deduplicate existing data
-- =====================================================

-- Deduplicate Categories
WITH duplicates AS (
  SELECT 
    normalized_name,
    array_agg(id ORDER BY created_at) AS ids,
    array_agg(name ORDER BY created_at) AS names
  FROM public.categories
  WHERE active = true
  GROUP BY normalized_name
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    normalized_name,
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS delete_ids,
    names[1] AS keep_name
  FROM duplicates
)
UPDATE public.categories c
SET active = false
FROM keep_first kf
WHERE c.id = ANY(kf.delete_ids);

-- Update brands to point to kept categories
WITH duplicates AS (
  SELECT 
    normalized_name,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.categories
  GROUP BY normalized_name
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    normalized_name,
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS delete_ids
  FROM duplicates
)
UPDATE public.brands b
SET category_id = kf.keep_id
FROM keep_first kf, public.categories c
WHERE b.category_id = c.id 
  AND c.id = ANY(kf.delete_ids)
  AND b.active = true;

-- Deduplicate Brands (within same category)
WITH duplicates AS (
  SELECT 
    category_id,
    normalized_name,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.brands
  WHERE active = true
  GROUP BY category_id, normalized_name
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    category_id,
    normalized_name,
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS delete_ids
  FROM duplicates
)
UPDATE public.brands b
SET active = false
FROM keep_first kf
WHERE b.id = ANY(kf.delete_ids);

-- Update machinery_models to point to kept brands
WITH duplicates AS (
  SELECT 
    category_id,
    normalized_name,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.brands
  WHERE active = true
  GROUP BY category_id, normalized_name
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS delete_ids
  FROM duplicates
)
UPDATE public.machinery_models m
SET brand_id = kf.keep_id
FROM keep_first kf, public.brands b
WHERE m.brand_id = b.id 
  AND b.id = ANY(kf.delete_ids)
  AND m.active = true;

-- Deduplicate Models (within same brand)
WITH duplicates AS (
  SELECT 
    brand_id,
    normalized_name,
    array_agg(id ORDER BY created_at) AS ids
  FROM public.machinery_models
  WHERE active = true
  GROUP BY brand_id, normalized_name
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT 
    ids[1] AS keep_id,
    ids[2:array_length(ids,1)] AS delete_ids
  FROM duplicates
)
UPDATE public.machinery_models m
SET active = false
FROM keep_first kf
WHERE m.id = ANY(kf.delete_ids);

-- =====================================================
-- PART 3: Add unique constraints
-- =====================================================

-- Unique constraint for categories (only active ones)
DROP INDEX IF EXISTS unique_active_category_normalized_name;
CREATE UNIQUE INDEX unique_active_category_normalized_name 
  ON public.categories(normalized_name) 
  WHERE active = true;

-- Unique constraint for brands (only active ones, per category)
DROP INDEX IF EXISTS unique_active_brand_per_category;
CREATE UNIQUE INDEX unique_active_brand_per_category 
  ON public.brands(category_id, normalized_name) 
  WHERE active = true;

-- Unique constraint for models (only active ones, per brand)
DROP INDEX IF EXISTS unique_active_model_per_brand;
CREATE UNIQUE INDEX unique_active_model_per_brand 
  ON public.machinery_models(brand_id, normalized_name) 
  WHERE active = true;