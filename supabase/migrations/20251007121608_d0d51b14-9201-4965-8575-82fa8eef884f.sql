-- Add indexes for customer search performance
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON customers_db (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers_db (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers_db (phone);

-- Add is_deleted column for soft delete
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add suburb and postcode columns for better duplicate detection
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS suburb TEXT;
ALTER TABLE customers_db ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Composite index for name + postcode fuzzy matching
CREATE INDEX IF NOT EXISTS idx_customers_name_postcode ON customers_db (LOWER(name), postcode) WHERE is_deleted = false;

-- Index on jobs for customer history
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db (customer_id);

-- Create function for customer search with pagination
CREATE OR REPLACE FUNCTION fn_search_customers(
  search_query TEXT,
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  suburb TEXT,
  postcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.suburb,
    c.postcode,
    c.notes,
    c.created_at,
    c.updated_at
  FROM customers_db c
  WHERE c.is_deleted = false
    AND (
      search_query = '' OR
      LOWER(c.name) LIKE '%' || LOWER(search_query) || '%' OR
      c.phone LIKE '%' || search_query || '%' OR
      LOWER(c.email) LIKE '%' || LOWER(search_query) || '%'
    )
  ORDER BY c.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;