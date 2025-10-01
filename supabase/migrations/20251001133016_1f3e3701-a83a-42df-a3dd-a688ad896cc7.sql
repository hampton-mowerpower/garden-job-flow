-- Fix security issue: Restrict service_reminders SELECT access to admin and counter roles only
-- Drop the overly permissive policy that allows all authenticated users to view customer contact info
DROP POLICY IF EXISTS "Authenticated users can view reminders" ON public.service_reminders;

-- Create a new restrictive policy that only allows admin and counter roles to view reminders
CREATE POLICY "Admin and counter can view reminders" 
ON public.service_reminders 
FOR SELECT 
USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'counter'::text]));