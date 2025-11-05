
-- Fix remaining calculation errors by running recalc one more time
-- Some jobs may have had concurrent updates during first run

DO $$
DECLARE
  job_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR job_rec IN 
    SELECT j.id FROM public.jobs_db j
    WHERE j.deleted_at IS NULL
    AND ABS(j.grand_total - (
      COALESCE(j.parts_subtotal,0) + 
      COALESCE(j.labour_total,0) + 
      COALESCE(j.gst,0) + 
      COALESCE(j.transport_total_charge,0) + 
      COALESCE(j.sharpen_total_charge,0) + 
      COALESCE(j.small_repair_total,0)
    )) > 0.01
  LOOP
    PERFORM public.recalc_job_totals(job_rec.id);
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculated % jobs with errors', v_count;
END $$;
