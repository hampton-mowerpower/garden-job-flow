
-- Recalculate and fix totals for JB2025-0066
-- Current wrong totals: subtotal=$26,075, should be $155 + $60 = $215

WITH job_totals AS (
  SELECT 
    j.id,
    j.parts_subtotal,
    j.labour_total,
    COALESCE(SUM(js.amount), 0) as sales_total
  FROM jobs_db j
  LEFT JOIN job_sales_items js ON js.job_id = j.id AND js.collect_with_job = true
  WHERE j.job_number = 'JB2025-0066'
  GROUP BY j.id, j.parts_subtotal, j.labour_total
)
UPDATE jobs_db j
SET 
  subtotal = jt.parts_subtotal + jt.labour_total + jt.sales_total,
  gst = (jt.parts_subtotal + jt.labour_total + jt.sales_total) * 0.10 / 1.10,
  grand_total = jt.parts_subtotal + jt.labour_total + jt.sales_total,
  balance_due = (jt.parts_subtotal + jt.labour_total + jt.sales_total) - COALESCE(j.service_deposit, 0),
  updated_at = now()
FROM job_totals jt
WHERE j.id = jt.id;

-- Verify the fix
DO $$
DECLARE
  job_rec RECORD;
BEGIN
  SELECT 
    job_number,
    parts_subtotal,
    labour_total,
    subtotal,
    gst,
    grand_total,
    service_deposit,
    balance_due
  INTO job_rec
  FROM jobs_db
  WHERE job_number = 'JB2025-0066';
  
  RAISE NOTICE 'JB2025-0066 totals fixed: Parts=%, Labour=%, Subtotal=%, GST=%, Total=%, Balance=%',
    job_rec.parts_subtotal,
    job_rec.labour_total,
    job_rec.subtotal,
    job_rec.gst,
    job_rec.grand_total,
    job_rec.balance_due;
END $$;
