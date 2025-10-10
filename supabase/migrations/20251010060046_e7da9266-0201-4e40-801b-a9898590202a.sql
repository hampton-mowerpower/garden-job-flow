-- Fix job_notes foreign key to reference user_profiles instead of auth.users
-- Drop existing foreign key constraint
ALTER TABLE job_notes DROP CONSTRAINT IF EXISTS job_notes_user_id_fkey;

-- Add correct foreign key to user_profiles
ALTER TABLE job_notes 
  ADD CONSTRAINT job_notes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

-- Also add foreign key for created_by if it doesn't exist
ALTER TABLE job_notes DROP CONSTRAINT IF EXISTS job_notes_created_by_fkey;

ALTER TABLE job_notes 
  ADD CONSTRAINT job_notes_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES user_profiles(id) 
  ON DELETE SET NULL;