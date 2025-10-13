-- Fix Craig Williams duplicate and add missing company name
UPDATE customers_db 
SET company_name = 'Turf Glo',
    customer_type = 'commercial',
    updated_at = now()
WHERE id = '61352ffd-5d0c-4720-8a57-3f79aaa634d3';

-- Mark duplicate as merged
UPDATE customers_db
SET merged_into_id = '61352ffd-5d0c-4720-8a57-3f79aaa634d3',
    is_deleted = true,
    updated_at = now()
WHERE id = '63e112cd-2bb7-4f32-a358-864b7fc712e9';

-- Drop and recreate search function with customer_type and company_name
DROP FUNCTION IF EXISTS fn_search_customers(text, integer, integer);

CREATE OR REPLACE FUNCTION fn_search_customers(
  search_query text DEFAULT '',
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  address text,
  suburb text,
  postcode text,
  notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  customer_type customer_type,
  company_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    c.updated_at,
    c.customer_type,
    c.company_name
  FROM customers_db c
  WHERE 
    c.is_deleted = false 
    AND c.merged_into_id IS NULL
    AND (
      search_query = '' 
      OR LOWER(c.name) LIKE '%' || LOWER(search_query) || '%'
      OR c.phone LIKE '%' || search_query || '%'
      OR LOWER(c.email) LIKE '%' || LOWER(search_query) || '%'
    )
  ORDER BY c.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;