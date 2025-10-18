
-- Clean up duplicate unpaid sales items for JB2025-0066
-- Keep only 2 unique items, delete the rest

WITH job_info AS (
  SELECT id FROM jobs_db WHERE job_number = 'JB2025-0066'
),
items_to_keep AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY description ORDER BY created_at) as rn
  FROM job_sales_items
  WHERE job_id = (SELECT id FROM job_info)
)
DELETE FROM job_sales_items
WHERE id IN (
  SELECT id FROM items_to_keep WHERE rn > 1
);

-- Verify the cleanup
DO $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO item_count
  FROM job_sales_items js
  JOIN jobs_db j ON j.id = js.job_id
  WHERE j.job_number = 'JB2025-0066';
  
  RAISE NOTICE 'JB2025-0066 now has % sales items (should be 2)', item_count;
END $$;
