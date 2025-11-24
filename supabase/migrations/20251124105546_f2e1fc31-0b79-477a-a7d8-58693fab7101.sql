-- Improve search RPC to handle all search fields properly
CREATE OR REPLACE FUNCTION public.get_jobs_list_with_subtotal(
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL::text,
  p_status text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  job_number text,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  status text,
  subtotal numeric,
  grand_total numeric,
  balance_due numeric,
  job_created_at timestamp with time zone,
  job_updated_at timestamp with time zone,
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  problem_description text,
  latest_note_text text,
  latest_note_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id, 
    j.job_number, 
    j.customer_id,
    c.name, 
    c.phone, 
    c.email,
    j.status,
    COALESCE(j.subtotal, 0) as subtotal,
    COALESCE(j.grand_total, 0) as grand_total,
    COALESCE(j.balance_due, 0) as balance_due,
    j.created_at, 
    j.updated_at,
    j.machine_category, 
    j.machine_brand, 
    j.machine_model, 
    j.machine_serial,
    j.problem_description,
    (SELECT jn.note_text FROM public.job_notes jn WHERE jn.job_id = j.id ORDER BY jn.created_at DESC LIMIT 1),
    (SELECT jn.created_at FROM public.job_notes jn WHERE jn.job_id = j.id ORDER BY jn.created_at DESC LIMIT 1)
  FROM public.jobs_db j
  LEFT JOIN public.customers_db c ON j.customer_id = c.id
  WHERE (j.deleted_at IS NULL OR j.deleted_at > NOW())
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR j.job_number ILIKE '%' || p_search || '%'
      OR j.machine_model ILIKE '%' || p_search || '%'
      OR j.machine_serial ILIKE '%' || p_search || '%'
      OR j.machine_brand ILIKE '%' || p_search || '%'
      OR j.machine_category ILIKE '%' || p_search || '%'
      OR j.problem_description ILIKE '%' || p_search || '%'
      OR c.name ILIKE '%' || p_search || '%'
      OR c.phone ILIKE '%' || p_search || '%'
    )
    AND (p_status IS NULL OR p_status = '' OR j.status = p_status)
  ORDER BY j.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;