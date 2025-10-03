-- Fix infinite recursion issue in user_profiles RLS policy
-- The has_role() function queries user_profiles, so we can't use it in user_profiles policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

-- Recreate without using has_role() to avoid recursion
CREATE POLICY "Authenticated users can view profiles"
ON user_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  ))
);

-- Actually, even that creates recursion. Let's use a simpler approach:
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

-- Allow users to view their own profile, and admins to view all
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);