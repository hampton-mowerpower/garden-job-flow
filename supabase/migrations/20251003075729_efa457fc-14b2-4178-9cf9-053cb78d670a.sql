-- Fix RLS policies for job_parts to allow counter role
DROP POLICY IF EXISTS "Authorized roles can manage job parts" ON job_parts;

-- Create separate policies for better control
CREATE POLICY "Authorized roles can insert job parts"
ON job_parts FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter'])
);

CREATE POLICY "Authorized roles can update job parts"
ON job_parts FOR UPDATE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter'])
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter'])
);

CREATE POLICY "Authorized roles can delete job parts"
ON job_parts FOR DELETE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter'])
);