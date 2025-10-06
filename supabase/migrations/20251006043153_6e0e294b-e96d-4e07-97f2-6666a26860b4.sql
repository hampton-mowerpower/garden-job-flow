-- Phase 1 Hot-Fix: Complete fix with missing column

-- ============================================
-- 1. ADD CATEGORY_ID TO BRANDS (if missing)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.brands ADD COLUMN category_id UUID REFERENCES public.categories(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_brands_category_id ON public.brands(category_id);

-- ============================================
-- 2. FIX RLS POLICIES FOR BRANDS
-- ============================================

DROP POLICY IF EXISTS "Admin and manager can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Admin and manager can update brands" ON public.brands;

CREATE POLICY "Authenticated users can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update brands"
ON public.brands
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. FIX RLS POLICIES FOR CATEGORIES
-- ============================================

DROP POLICY IF EXISTS "Admin and counter can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and counter can update categories" ON public.categories;

CREATE POLICY "Authenticated users can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. ADD CASE-INSENSITIVE UNIQUENESS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name_lower 
ON public.brands (lower(name)) 
WHERE active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_lower 
ON public.categories (lower(name)) 
WHERE active = true;

-- ============================================
-- 5. SEED QUICK PROBLEMS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quick_problems_label_key'
  ) THEN
    ALTER TABLE public.quick_problems 
    ADD CONSTRAINT quick_problems_label_key UNIQUE (label);
  END IF;
END $$;

INSERT INTO public.quick_problems (label, display_order, active)
VALUES
  ('Full service required', 0, true),
  ('Won''t start', 1, true),
  ('Blade sharpen', 2, true),
  ('No power / battery fault', 3, true),
  ('Fuel leak / smell of petrol', 4, true),
  ('Strange noise / vibration', 5, true)
ON CONFLICT (label) DO NOTHING;

-- ============================================
-- 6. AUDIT LOGGING
-- ============================================

CREATE OR REPLACE FUNCTION log_category_brand_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, target_type, target_id, actor_user_id, meta)
    VALUES (
      'created',
      TG_TABLE_NAME,
      NEW.id,
      auth.uid(),
      jsonb_build_object('name', NEW.name)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action, target_type, target_id, actor_user_id, meta)
    VALUES (
      'updated',
      TG_TABLE_NAME,
      NEW.id,
      auth.uid(),
      jsonb_build_object('old_name', OLD.name, 'new_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_brands_changes ON public.brands;
CREATE TRIGGER audit_brands_changes
AFTER INSERT OR UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION log_category_brand_changes();

DROP TRIGGER IF EXISTS audit_categories_changes ON public.categories;
CREATE TRIGGER audit_categories_changes
AFTER INSERT OR UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION log_category_brand_changes();

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================

ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.brands REPLICA IDENTITY FULL;
ALTER TABLE public.quick_problems REPLICA IDENTITY FULL;