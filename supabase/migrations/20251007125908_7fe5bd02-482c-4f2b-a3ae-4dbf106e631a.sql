-- Add part_group column to parts_catalogue for organizing parts by category
ALTER TABLE parts_catalogue ADD COLUMN IF NOT EXISTS part_group TEXT;

-- Add index for faster filtering by part_group
CREATE INDEX IF NOT EXISTS idx_parts_catalogue_part_group ON parts_catalogue(part_group);

-- Add index for faster filtering by category + part_group combination
CREATE INDEX IF NOT EXISTS idx_parts_catalogue_category_group ON parts_catalogue(category, part_group);