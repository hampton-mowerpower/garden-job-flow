-- Fix the recursion properly - user_profiles should not check roles in its own SELECT policy

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Simple policy: authenticated users can view all profiles
-- This is safe because user_profiles only contains non-sensitive data (email, name, role)
-- Role checks will be enforced on OTHER tables using has_role()
CREATE POLICY "Authenticated users can view all profiles"
ON user_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);