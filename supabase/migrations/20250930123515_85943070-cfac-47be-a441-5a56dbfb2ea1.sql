-- Add audit trail columns to parts_catalogue
ALTER TABLE parts_catalogue 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create audit log table for parts
CREATE TABLE IF NOT EXISTS parts_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts_catalogue(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  old_data JSONB,
  new_data JSONB
);

-- Enable RLS on audit log
ALTER TABLE parts_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit logs
CREATE POLICY "Authenticated users can view audit logs"
ON parts_audit_log FOR SELECT
TO authenticated
USING (true);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON parts_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION log_parts_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO parts_audit_log (part_id, action, changed_by, old_data)
    VALUES (OLD.id, 'deleted', auth.uid(), row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO parts_audit_log (part_id, action, changed_by, old_data, new_data)
    VALUES (NEW.id, 'updated', auth.uid(), row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    INSERT INTO parts_audit_log (part_id, action, changed_by, new_data)
    VALUES (NEW.id, 'created', auth.uid(), row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for parts audit
DROP TRIGGER IF EXISTS parts_audit_trigger ON parts_catalogue;
CREATE TRIGGER parts_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON parts_catalogue
FOR EACH ROW EXECUTE FUNCTION log_parts_audit();

-- Update trigger to set updated_by
CREATE OR REPLACE FUNCTION set_parts_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_parts_updated_by_trigger ON parts_catalogue;
CREATE TRIGGER set_parts_updated_by_trigger
BEFORE UPDATE ON parts_catalogue
FOR EACH ROW EXECUTE FUNCTION set_parts_updated_by();