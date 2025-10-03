-- Make part_id nullable to support custom parts
ALTER TABLE job_parts ALTER COLUMN part_id DROP NOT NULL;

-- Add a description column for custom parts
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS description TEXT;

-- Update RLS policies are already correct (counter role has access)