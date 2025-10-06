-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.seed_super_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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