-- Fix security warnings: Add search_path to functions

CREATE OR REPLACE FUNCTION normalize_name(input_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(input_name, '\s+', ' ', 'g')));
END;
$$;

CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.normalized_name := normalize_name(NEW.name);
  RETURN NEW;
END;
$$;