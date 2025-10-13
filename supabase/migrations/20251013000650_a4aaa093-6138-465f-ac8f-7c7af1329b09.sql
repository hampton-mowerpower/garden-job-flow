-- Update RLS policies for machinery_models to allow counter users to create models

-- Drop existing insert policy
DROP POLICY IF EXISTS "Admin and manager can insert models" ON machinery_models;

-- Recreate with counter role added
CREATE POLICY "Admin, manager and counter can insert models"
ON machinery_models
FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]));

-- Update the update policy as well to allow counter users
DROP POLICY IF EXISTS "Admin and manager can update models" ON machinery_models;

CREATE POLICY "Admin, manager and counter can update models"
ON machinery_models
FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]));