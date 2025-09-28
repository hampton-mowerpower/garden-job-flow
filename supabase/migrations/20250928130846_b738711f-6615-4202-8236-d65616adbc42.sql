-- Fix critical security vulnerabilities in RLS policies
-- This migration restricts access to sensitive data to prevent unauthorized access

-- 1. Fix user_profiles table - most critical security issue
-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create new restrictive policy: users can only see their own profile, admins can see all
CREATE POLICY "Users can view own profile or admins view all" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 
    FROM public.user_profiles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.role = 'admin'
  )
);

-- 2. Fix customers_db table - ensure authentication is required
-- Drop and recreate the customer SELECT policy to ensure it's properly restricted
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers_db;

CREATE POLICY "Authenticated users can view customers" 
ON public.customers_db 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Fix jobs_db table - ensure authentication is required  
-- Drop and recreate the jobs SELECT policy to ensure it's properly restricted
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.jobs_db;

CREATE POLICY "Authenticated users can view jobs" 
ON public.jobs_db 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Fix job_parts table - ensure authentication is required
-- Drop and recreate the job_parts SELECT policy to ensure it's properly restricted  
DROP POLICY IF EXISTS "Authenticated users can view job parts" ON public.job_parts;

CREATE POLICY "Authenticated users can view job parts" 
ON public.job_parts 
FOR SELECT 
TO authenticated
USING (true);

-- 5. Fix parts_catalogue table - ensure authentication is required
-- Drop and recreate the parts SELECT policy to ensure it's properly restricted
DROP POLICY IF EXISTS "Authenticated users can view parts" ON public.parts_catalogue;

CREATE POLICY "Authenticated users can view parts" 
ON public.parts_catalogue 
FOR SELECT 
TO authenticated
USING (true);