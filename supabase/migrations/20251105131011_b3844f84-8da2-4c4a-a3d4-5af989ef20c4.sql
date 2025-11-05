
-- Fix recalc_job_totals to include ALL components (transport, sharpen, small_repair)
CREATE OR REPLACE FUNCTION public.recalc_job_totals(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_parts NUMERIC := 0;
  v_labour NUMERIC := 0;
  v_transport NUMERIC := 0;
  v_sharpen NUMERIC := 0;
  v_small_repair NUMERIC := 0;
  v_subtotal NUMERIC;
  v_gst NUMERIC;
  v_grand_total NUMERIC;
BEGIN
  -- Sum parts
  SELECT COALESCE(SUM(quantity * unit_price), 0) INTO v_parts 
  FROM public.job_parts WHERE job_id = p_job_id;
  
  -- Get labour
  SELECT COALESCE(labour_hours * labour_rate, 0) INTO v_labour 
  FROM public.jobs_db WHERE id = p_job_id;
  
  -- Get transport, sharpen, small_repair
  SELECT 
    COALESCE(transport_total_charge, 0),
    COALESCE(sharpen_total_charge, 0),
    COALESCE(small_repair_total, 0)
  INTO v_transport, v_sharpen, v_small_repair
  FROM public.jobs_db WHERE id = p_job_id;
  
  -- Calculate subtotal (includes ALL components)
  v_subtotal := v_parts + v_labour + v_transport + v_sharpen + v_small_repair;
  
  -- Calculate GST (10%)
  v_gst := ROUND(v_subtotal * 0.10, 2);
  
  -- Calculate grand total
  v_grand_total := v_subtotal + v_gst;
  
  -- Update job with correct totals
  UPDATE public.jobs_db SET 
    parts_subtotal = v_parts, 
    labour_total = v_labour, 
    subtotal = v_subtotal, 
    gst = v_gst, 
    grand_total = v_grand_total,
    updated_at = NOW() 
  WHERE id = p_job_id;
END;
$function$;

-- Run recalc on all jobs one final time with the corrected function
DO $$
DECLARE
  job_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR job_rec IN 
    SELECT id FROM public.jobs_db WHERE deleted_at IS NULL
  LOOP
    PERFORM public.recalc_job_totals(job_rec.id);
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculated ALL % jobs with corrected function', v_count;
END $$;
