-- Add merged_into_id column to customers_db for tracking merges
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES customers_db(id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view customer audit" ON customer_audit;
DROP POLICY IF EXISTS "Authorized roles can insert customer audit" ON customer_audit;

-- Create customer_audit table for tracking all customer changes
CREATE TABLE IF NOT EXISTS customer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers_db(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'merged')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on customer_audit
ALTER TABLE customer_audit ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit logs
CREATE POLICY "Authenticated users can view customer audit"
  ON customer_audit FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authorized roles to insert audit logs
CREATE POLICY "Authorized roles can insert customer audit"
  ON customer_audit FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- Create index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_customers_phone_email ON customers_db(phone, email) WHERE is_deleted = false;

-- Create function to find duplicates
CREATE OR REPLACE FUNCTION find_customer_duplicates()
RETURNS TABLE(
  customer_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  duplicate_ids UUID[],
  duplicate_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH duplicate_groups AS (
    SELECT 
      c1.id,
      c1.name,
      c1.phone,
      c1.email,
      ARRAY_AGG(DISTINCT c2.id) FILTER (WHERE c2.id != c1.id) as dup_ids
    FROM customers_db c1
    INNER JOIN customers_db c2 ON (
      (c1.phone = c2.phone OR c1.email = c2.email)
      AND c1.id < c2.id
    )
    WHERE c1.is_deleted = false 
      AND c2.is_deleted = false
      AND c1.merged_into_id IS NULL
      AND c2.merged_into_id IS NULL
    GROUP BY c1.id, c1.name, c1.phone, c1.email
    HAVING COUNT(DISTINCT c2.id) > 0
  )
  SELECT 
    dg.id,
    dg.name,
    dg.phone,
    dg.email,
    dg.dup_ids,
    array_length(dg.dup_ids, 1)
  FROM duplicate_groups dg
  ORDER BY array_length(dg.dup_ids, 1) DESC, dg.id;
END;
$$;