-- Update RLS policies for machinery_models to allow counter users to create models

-- Drop and recreate insert policy with counter role
DROP POLICY IF EXISTS "Admin and manager can insert models" ON machinery_models;
DROP POLICY IF EXISTS "Admin, manager and counter can insert models" ON machinery_models;

CREATE POLICY "Admin, manager and counter can insert models"
ON machinery_models
FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]));

-- Drop and recreate update policy with counter role  
DROP POLICY IF EXISTS "Admin and manager can update models" ON machinery_models;
DROP POLICY IF EXISTS "Admin, manager and counter can update models" ON machinery_models;

CREATE POLICY "Admin, manager and counter can update models"
ON machinery_models
FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::text, 'manager'::text, 'counter'::text]));