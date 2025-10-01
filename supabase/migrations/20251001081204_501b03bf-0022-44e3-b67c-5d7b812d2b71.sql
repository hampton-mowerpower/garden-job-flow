-- Create reminders table for service and collection notifications
CREATE TABLE IF NOT EXISTS public.service_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers_db(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs_db(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('service_due', 'collection_ready')),
  reminder_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  contact_email TEXT,
  contact_phone TEXT,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_reminders_customer ON public.service_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_job ON public.service_reminders(job_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_date_status ON public.service_reminders(reminder_date, status);

-- Enable RLS
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view reminders"
ON public.service_reminders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized roles can insert reminders"
ON public.service_reminders
FOR INSERT
TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Authorized roles can update reminders"
ON public.service_reminders
FOR UPDATE
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Admins can delete reminders"
ON public.service_reminders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_service_reminders_updated_at
  BEFORE UPDATE ON public.service_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();