-- Add payment tracking table
CREATE TABLE IF NOT EXISTS public.job_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs_db(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  gst_component NUMERIC NOT NULL DEFAULT 0 CHECK (gst_component >= 0),
  method TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add balance_due column to jobs_db for quick reads
ALTER TABLE public.jobs_db 
ADD COLUMN IF NOT EXISTS balance_due NUMERIC NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.job_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_payments
CREATE POLICY "Authenticated users can view payments"
  ON public.job_payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert payments"
  ON public.job_payments FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter', 'technician']));

CREATE POLICY "Admins can update payments"
  ON public.job_payments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payments"
  ON public.job_payments FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON public.job_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_paid_at ON public.job_payments(paid_at DESC);