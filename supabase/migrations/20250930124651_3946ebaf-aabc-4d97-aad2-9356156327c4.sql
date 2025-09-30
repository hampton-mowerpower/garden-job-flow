-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Fix Customer Data Exposure: Restrict customer viewing to admin and counter only
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers_db;

CREATE POLICY "Admin and counter can view customers" 
ON public.customers_db 
FOR SELECT 
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- Fix Privilege Escalation: Prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view own profile or admins view all"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update own profile (except role)"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- User cannot change their own role
    role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update jobs_db policies to use security definer functions
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.jobs_db;
DROP POLICY IF EXISTS "Technicians and counter can insert jobs" ON public.jobs_db;
DROP POLICY IF EXISTS "Technicians and counter can update jobs" ON public.jobs_db;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs_db;

CREATE POLICY "Authenticated users can view jobs"
ON public.jobs_db
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert jobs"
ON public.jobs_db
FOR INSERT
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']));

CREATE POLICY "Authorized roles can update jobs"
ON public.jobs_db
FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']));

CREATE POLICY "Admins can delete jobs"
ON public.jobs_db
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update customers_db policies to use security definer functions
DROP POLICY IF EXISTS "Counter and admin can insert customers" ON public.customers_db;
DROP POLICY IF EXISTS "Counter and admin can update customers" ON public.customers_db;
DROP POLICY IF EXISTS "Admin can delete customers" ON public.customers_db;

CREATE POLICY "Admin and counter can insert customers"
ON public.customers_db
FOR INSERT
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Admin and counter can update customers"
ON public.customers_db
FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'counter']))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Admins can delete customers"
ON public.customers_db
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update parts_catalogue policies to use security definer functions
DROP POLICY IF EXISTS "Admin can manage parts" ON public.parts_catalogue;
DROP POLICY IF EXISTS "Authenticated users can view parts" ON public.parts_catalogue;

CREATE POLICY "Authenticated users can view parts"
ON public.parts_catalogue
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage parts"
ON public.parts_catalogue
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update job_parts policies to use security definer functions
DROP POLICY IF EXISTS "Authenticated users can view job parts" ON public.job_parts;
DROP POLICY IF EXISTS "Technicians can manage job parts" ON public.job_parts;

CREATE POLICY "Authenticated users can view job parts"
ON public.job_parts
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can manage job parts"
ON public.job_parts
FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'technician']))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'technician']));