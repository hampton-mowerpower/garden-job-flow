-- Fix security: Set search_path on normalize function
CREATE OR REPLACE FUNCTION normalize_customer_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  NEW.normalized_phone := REGEXP_REPLACE(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$;