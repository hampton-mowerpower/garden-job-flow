
-- Enable RLS on system_maintenance_mode table
ALTER TABLE system_maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage maintenance mode
CREATE POLICY "Admins can manage maintenance mode"
ON system_maintenance_mode
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow authenticated users to view maintenance status
CREATE POLICY "Users can view maintenance status"
ON system_maintenance_mode
FOR SELECT
USING (auth.uid() IS NOT NULL);
