-- Fix 1: Update job_notes foreign key to reference auth.users instead of user_profiles
-- This prevents foreign key violations when user_profile doesn't exist yet
ALTER TABLE job_notes DROP CONSTRAINT IF EXISTS job_notes_user_id_fkey;
ALTER TABLE job_notes ADD CONSTRAINT job_notes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix 2: Add 'write_off' to the jobs_db status check constraint
-- First, drop the existing constraint
ALTER TABLE jobs_db DROP CONSTRAINT IF EXISTS jobs_db_status_check;

-- Recreate it with write_off included
ALTER TABLE jobs_db ADD CONSTRAINT jobs_db_status_check 
  CHECK (status IN (
    'pending',
    'awaiting_parts', 
    'awaiting_quote',
    'in-progress',
    'completed',
    'delivered',
    'write_off'
  ));