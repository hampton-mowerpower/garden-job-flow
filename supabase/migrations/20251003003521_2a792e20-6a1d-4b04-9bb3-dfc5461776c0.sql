-- Add discount and deposit fields to jobs_db
ALTER TABLE public.jobs_db 
ADD COLUMN IF NOT EXISTS discount_type text CHECK (discount_type IN ('PERCENT', 'AMOUNT')),
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS deposit_method text;

-- Create job search preferences table for cross-computer sync
CREATE TABLE IF NOT EXISTS public.job_search_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on job_search_prefs
ALTER TABLE public.job_search_prefs ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own search preferences
CREATE POLICY "Users can view own search prefs" 
ON public.job_search_prefs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search prefs" 
ON public.job_search_prefs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search prefs" 
ON public.job_search_prefs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_job_search_prefs_updated_at
BEFORE UPDATE ON public.job_search_prefs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_search_prefs_user_id ON public.job_search_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_db_discount ON public.jobs_db(discount_type, discount_value);