
-- Drop old function signatures and create new one with part_id parameter
DROP FUNCTION IF EXISTS public.add_job_part(uuid, text, text, numeric, numeric);

CREATE OR REPLACE FUNCTION public.add_job_part(
  p_job_id uuid, 
  p_sku text, 
  p_desc text, 
  p_qty numeric, 
  p_unit_price numeric,
  p_part_id uuid DEFAULT NULL  -- New parameter for catalogue part ID
)
RETURNS job_parts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result public.job_parts;
BEGIN
  -- Insert the part with the provided part_id (NULL for custom parts)
  INSERT INTO public.job_parts (
    id,
    job_id,
    part_id,  -- Can be NULL for custom parts
    sku,
    description,
    quantity,
    unit_price,
    total_price,
    created_at,
    tax_code,
    is_custom
  ) VALUES (
    gen_random_uuid(),
    p_job_id,
    p_part_id,  -- NULL if not from catalogue
    COALESCE(p_sku, 'UNKNOWN'),
    COALESCE(p_desc, 'Part'),
    COALESCE(p_qty, 1),
    COALESCE(p_unit_price, 0),
    COALESCE(p_qty, 1) * COALESCE(p_unit_price, 0),
    NOW(),
    'GST',
    (p_part_id IS NULL)  -- Mark as custom if no catalogue reference
  )
  RETURNING * INTO v_result;
  
  -- Recalculate job totals
  PERFORM recalc_job_totals(p_job_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add part: %', SQLERRM;
END;
$function$;
