-- Fix search_path for trigger function
DROP FUNCTION IF EXISTS update_email_outbox_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_email_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_email_outbox_updated_at
  BEFORE UPDATE ON public.email_outbox
  FOR EACH ROW
  EXECUTE FUNCTION update_email_outbox_updated_at();