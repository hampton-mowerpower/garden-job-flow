-- Create customer change audit table
CREATE TABLE IF NOT EXISTS public.customer_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  job_id UUID NOT NULL REFERENCES public.jobs_db(id) ON DELETE CASCADE,
  job_number TEXT,
  old_customer_id UUID,
  new_customer_id UUID,
  old_customer_name TEXT,
  new_customer_name TEXT,
  old_customer_phone TEXT,
  new_customer_phone TEXT,
  old_customer_email TEXT,
  new_customer_email TEXT,
  old_customer_company TEXT,
  new_customer_company TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_customer_change_audit_job_id ON public.customer_change_audit(job_id);
CREATE INDEX IF NOT EXISTS idx_customer_change_audit_changed_at ON public.customer_change_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_change_audit_changed_by ON public.customer_change_audit(changed_by);

-- Enable RLS
ALTER TABLE public.customer_change_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view customer change audit"
  ON public.customer_change_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert customer change audit"
  ON public.customer_change_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by OR auth.uid() IS NOT NULL);

COMMENT ON TABLE public.customer_change_audit IS 'Audit log for all customer information changes on jobs';