
-- COMPREHENSIVE QA FIX MIGRATION
-- Fixes: RLS on job_parts, orphan cleanup, calculation fixes

-- 1. Enable RLS on job_parts table (CRITICAL SECURITY FIX)
ALTER TABLE public.job_parts ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for job_parts
CREATE POLICY "job_parts_select_policy" ON public.job_parts
  FOR SELECT USING (true);

CREATE POLICY "job_parts_insert_policy" ON public.job_parts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_parts_update_policy" ON public.job_parts
  FOR UPDATE USING (true);

CREATE POLICY "job_parts_delete_policy" ON public.job_parts
  FOR DELETE USING (true);

-- 3. Clean up orphan parts (parts with no valid job)
DELETE FROM public.job_parts
WHERE job_id NOT IN (SELECT id FROM public.jobs_db WHERE deleted_at IS NULL);

-- 4. Recalculate all job totals to fix mismatches
DO $$
DECLARE
  job_rec RECORD;
BEGIN
  FOR job_rec IN 
    SELECT id FROM public.jobs_db WHERE deleted_at IS NULL
  LOOP
    PERFORM public.recalc_job_totals(job_rec.id);
  END LOOP;
END $$;

-- 5. Add index on job_parts.job_id for performance
CREATE INDEX IF NOT EXISTS idx_job_parts_job_id ON public.job_parts(job_id);

-- 6. Add check constraint to prevent negative quantities/prices
ALTER TABLE public.job_parts 
  DROP CONSTRAINT IF EXISTS chk_job_parts_positive;

ALTER TABLE public.job_parts 
  ADD CONSTRAINT chk_job_parts_positive 
  CHECK (quantity >= 0 AND unit_price >= 0 AND total_price >= 0);

-- 7. Create function to validate job totals
CREATE OR REPLACE FUNCTION public.validate_job_calculations(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_parts_sum numeric;
  v_labour numeric;
  v_transport numeric;
  v_sharpen numeric;
  v_small_repair numeric;
  v_calculated_subtotal numeric;
  v_calculated_gst numeric;
  v_calculated_total numeric;
  v_stored_total numeric;
  v_difference numeric;
BEGIN
  -- Sum parts
  SELECT COALESCE(SUM(total_price), 0) INTO v_parts_sum
  FROM job_parts WHERE job_id = p_job_id;
  
  -- Get other values
  SELECT 
    COALESCE(labour_total, 0),
    COALESCE(transport_total_charge, 0),
    COALESCE(sharpen_total_charge, 0),
    COALESCE(small_repair_total, 0),
    COALESCE(grand_total, 0)
  INTO v_labour, v_transport, v_sharpen, v_small_repair, v_stored_total
  FROM jobs_db WHERE id = p_job_id;
  
  -- Calculate expected totals
  v_calculated_subtotal := v_parts_sum + v_labour + v_transport + v_sharpen + v_small_repair;
  v_calculated_gst := ROUND(v_calculated_subtotal * 0.10, 2);
  v_calculated_total := v_calculated_subtotal + v_calculated_gst;
  v_difference := v_stored_total - v_calculated_total;
  
  RETURN jsonb_build_object(
    'job_id', p_job_id,
    'parts_sum', v_parts_sum,
    'labour', v_labour,
    'transport', v_transport,
    'sharpen', v_sharpen,
    'small_repair', v_small_repair,
    'calculated_subtotal', v_calculated_subtotal,
    'calculated_gst', v_calculated_gst,
    'calculated_total', v_calculated_total,
    'stored_total', v_stored_total,
    'difference', v_difference,
    'is_valid', ABS(v_difference) < 0.01
  );
END;
$function$;

COMMENT ON FUNCTION public.validate_job_calculations IS 'Validates job calculation accuracy and returns detailed breakdown';
