-- Add additional_notes column to jobs_db table
-- This field stores extra customer notes separate from the problem description
ALTER TABLE public.jobs_db 
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.jobs_db.additional_notes IS 'Additional customer notes or special requests, printed on service labels and invoices';

-- Create index on name column for customers table for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers_db USING btree (name);

-- Create index on email column for customers table
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers_db USING btree (email);

-- Create index on phone column for customers table  
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers_db USING btree (phone);