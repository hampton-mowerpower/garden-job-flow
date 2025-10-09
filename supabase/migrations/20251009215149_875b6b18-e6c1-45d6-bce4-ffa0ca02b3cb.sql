-- Add account_customer_id to jobs_db table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs_db' 
    AND column_name = 'account_customer_id'
  ) THEN
    ALTER TABLE public.jobs_db 
    ADD COLUMN account_customer_id uuid REFERENCES public.account_customers(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_jobs_account_customer 
    ON public.jobs_db(account_customer_id);
  END IF;
END $$;