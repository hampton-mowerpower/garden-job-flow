-- Remove old global unique constraints on brand names
-- These prevent the same brand from existing in different categories

DROP INDEX IF EXISTS public.brands_name_unique_lower;
DROP INDEX IF EXISTS public.idx_brands_name_lower;

-- The correct indexes (already created in previous migration) are:
-- brands_category_normalized_name_unique: allows same brand in different categories  
-- brands_null_category_normalized_name_unique: for brands without category