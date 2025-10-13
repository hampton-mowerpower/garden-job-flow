-- Update brands table to allow same brand name in different categories
-- Drop the global unique constraint on name
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_name_key;
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_normalized_name_key;

-- Add a unique constraint on (category_id, normalized_name) to allow same brand in different categories
-- but prevent duplicates within the same category
CREATE UNIQUE INDEX IF NOT EXISTS brands_category_normalized_name_unique 
ON brands(category_id, normalized_name) 
WHERE active = true;

-- Also create a unique index for brands without a category (NULL category_id)
CREATE UNIQUE INDEX IF NOT EXISTS brands_null_category_normalized_name_unique 
ON brands(normalized_name) 
WHERE active = true AND category_id IS NULL;