-- ============================================
-- User Roles Table - Security Enhancement
-- ============================================

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- RLS Policies  
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['SUPER_ADMIN', 'ADMIN']));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['SUPER_ADMIN', 'ADMIN']));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_any_role(auth.uid(), ARRAY['SUPER_ADMIN', 'ADMIN']));

CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed super admin function
CREATE OR REPLACE FUNCTION public.seed_super_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'hamptonmowerpower@gmail.com'
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'SUPER_ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    UPDATE public.user_profiles
    SET status = 'ACTIVE', role = 'admin'
    WHERE user_id = admin_user_id;
  END IF;
END;
$$;

-- Add transport columns to jobs_db
DO $$ 
BEGIN
  ALTER TABLE public.jobs_db 
    ADD COLUMN IF NOT EXISTS transport_pickup_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS transport_delivery_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS transport_size_tier TEXT,
    ADD COLUMN IF NOT EXISTS transport_distance_km NUMERIC,
    ADD COLUMN IF NOT EXISTS transport_total_charge NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sharpen_items JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sharpen_total_charge NUMERIC DEFAULT 0;
END $$;