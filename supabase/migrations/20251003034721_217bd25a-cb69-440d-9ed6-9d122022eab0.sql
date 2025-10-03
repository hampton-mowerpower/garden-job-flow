-- Fix security issues by ensuring anonymous users cannot access sensitive data

-- Drop and recreate more restrictive policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON user_profiles;

CREATE POLICY "Authenticated users can view profiles"
ON user_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'))
);

-- Drop and recreate more restrictive policies for service_reminders  
DROP POLICY IF EXISTS "Admin and counter can view reminders" ON service_reminders;

CREATE POLICY "Authenticated admins and counter can view reminders"
ON service_reminders
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND has_any_role(auth.uid(), ARRAY['admin', 'counter'])
);

-- Drop and recreate more restrictive policies for jobs_db
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON jobs_db;

CREATE POLICY "Only authenticated users can view jobs"
ON jobs_db
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit block policy for customers_db to ensure consistency
DROP POLICY IF EXISTS "Admin and counter can view customers" ON customers_db;

CREATE POLICY "Authenticated users can view customers"
ON customers_db
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND has_any_role(auth.uid(), ARRAY['admin', 'counter'])
);

-- Ensure job_parts requires authentication
DROP POLICY IF EXISTS "Authenticated users can view job parts" ON job_parts;

CREATE POLICY "Only authenticated users can view job parts"
ON job_parts
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Ensure parts_catalogue requires authentication
DROP POLICY IF EXISTS "Authenticated users can view parts" ON parts_catalogue;

CREATE POLICY "Only authenticated users can view parts"
ON parts_catalogue
FOR SELECT
USING (auth.uid() IS NOT NULL);