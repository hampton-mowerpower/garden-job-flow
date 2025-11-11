-- ============================================
-- COMPREHENSIVE FIX: Schema + RPCs
-- Following 6A + 5S Framework
-- ============================================

-- PHASE 1: FIX SCHEMA ISSUES
-- ============================================

-- Fix job_notes foreign key to user_profiles (via auth.users)
ALTER TABLE public.job_notes 
  DROP CONSTRAINT IF EXISTS job_notes_user_id_fkey;

ALTER TABLE public.job_notes 
  ADD CONSTRAINT job_notes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_notes_user_id ON public.job_notes(user_id);

-- ============================================
-- PHASE 2: CREATE MISSING RPC FUNCTIONS
-- ============================================

-- 2.1 GET JOB NOTES WITH USER INFO
CREATE OR REPLACE FUNCTION public.get_job_notes(p_job_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', jn.id,
        'job_id', jn.job_id,
        'note_text', jn.note_text,
        'visibility', jn.visibility,
        'created_at', jn.created_at,
        'user_id', jn.user_id,
        'user_name', COALESCE(up.full_name, 'System'),
        'user_email', up.email
      ) ORDER BY jn.created_at DESC
    ), '[]'::json)
    FROM public.job_notes jn
    LEFT JOIN public.user_profiles up ON up.user_id = jn.user_id
    WHERE jn.job_id = p_job_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2.2 ADD JOB NOTE
CREATE OR REPLACE FUNCTION public.add_job_note_rpc(
  p_job_id UUID,
  p_note_text TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_new_note_id UUID;
BEGIN
  INSERT INTO public.job_notes (job_id, note_text, user_id, visibility)
  VALUES (p_job_id, p_note_text, p_user_id, 'internal')
  RETURNING id INTO v_new_note_id;
  
  UPDATE public.jobs_db SET updated_at = NOW() WHERE id = p_job_id;
  
  RETURN public.get_job_notes(p_job_id);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 2.3 UPSERT CUSTOMER
CREATE OR REPLACE FUNCTION public.upsert_customer_rpc(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_suburb TEXT DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_customer_type TEXT DEFAULT 'domestic'
)
RETURNS JSON AS $$
DECLARE
  v_customer_id UUID;
  v_result JSON;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE public.customers_db
    SET 
      name = COALESCE(p_name, name),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      address = COALESCE(p_address, address),
      suburb = COALESCE(p_suburb, suburb),
      postcode = COALESCE(p_postcode, postcode),
      company_name = COALESCE(p_company_name, company_name),
      customer_type = COALESCE(p_customer_type::customer_type, customer_type),
      updated_at = NOW()
    WHERE id = p_id
    RETURNING id INTO v_customer_id;
  ELSE
    INSERT INTO public.customers_db (
      name, phone, email, address, suburb, postcode, company_name, customer_type
    ) VALUES (
      p_name, p_phone, p_email, p_address, p_suburb, p_postcode, p_company_name, p_customer_type::customer_type
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  SELECT row_to_json(c.*) INTO v_result
  FROM public.customers_db c
  WHERE c.id = v_customer_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 2.4 DELETE CUSTOMER
CREATE OR REPLACE FUNCTION public.delete_customer_rpc(p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.customers_db
  SET is_deleted = TRUE, updated_at = NOW()
  WHERE id = p_customer_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 2.5 SEARCH CUSTOMERS
CREATE OR REPLACE FUNCTION public.search_customers_rpc(
  p_search TEXT DEFAULT '',
  p_limit INT DEFAULT 50
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t.*)), '[]'::json)
    FROM (
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.email,
        c.address,
        c.suburb,
        c.postcode,
        c.customer_type,
        c.company_name,
        c.created_at,
        COUNT(j.id) as job_count
      FROM public.customers_db c
      LEFT JOIN public.jobs_db j ON j.customer_id = c.id AND j.deleted_at IS NULL
      WHERE c.is_deleted = FALSE
        AND (
          p_search = '' OR
          c.name ILIKE '%' || p_search || '%' OR
          c.phone LIKE '%' || p_search || '%' OR
          c.email ILIKE '%' || p_search || '%'
        )
      GROUP BY c.id
      ORDER BY c.name
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2.6 UPSERT PARTS CATALOGUE
CREATE OR REPLACE FUNCTION public.upsert_part_catalogue_rpc(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_sku TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_sell_price NUMERIC DEFAULT NULL,
  p_cost_price NUMERIC DEFAULT NULL,
  p_stock_qty NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  v_part_id UUID;
  v_result JSON;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE public.parts_catalogue
    SET 
      name = COALESCE(p_name, name),
      sku = COALESCE(p_sku, sku),
      category = COALESCE(p_category, category),
      sell_price = COALESCE(p_sell_price, sell_price),
      cost_price = COALESCE(p_cost_price, cost_price),
      stock_qty = COALESCE(p_stock_qty, stock_qty),
      description = COALESCE(p_description, description),
      active = COALESCE(p_active, active),
      updated_at = NOW()
    WHERE id = p_id
    RETURNING id INTO v_part_id;
  ELSE
    INSERT INTO public.parts_catalogue (
      name, sku, category, sell_price, cost_price, stock_qty, description, active
    ) VALUES (
      p_name, p_sku, p_category, p_sell_price, p_cost_price, p_stock_qty, p_description, p_active
    )
    RETURNING id INTO v_part_id;
  END IF;
  
  SELECT row_to_json(p.*) INTO v_result
  FROM public.parts_catalogue p
  WHERE p.id = v_part_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 2.7 DELETE PART FROM CATALOGUE
CREATE OR REPLACE FUNCTION public.delete_part_catalogue_rpc(p_part_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.parts_catalogue
  SET deleted_at = NOW(), active = FALSE
  WHERE id = p_part_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 2.8 GET PARTS CATALOGUE
CREATE OR REPLACE FUNCTION public.get_parts_catalogue_rpc(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT '',
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t.*)), '[]'::json)
    FROM (
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.sell_price,
        p.cost_price,
        p.stock_qty,
        p.description,
        p.active,
        p.created_at,
        p.updated_at
      FROM public.parts_catalogue p
      WHERE p.deleted_at IS NULL
        AND (p_category IS NULL OR p.category = p_category)
        AND (
          p_search = '' OR
          p.name ILIKE '%' || p_search || '%' OR
          p.sku ILIKE '%' || p_search || '%' OR
          p.description ILIKE '%' || p_search || '%'
        )
      ORDER BY p.name
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- PHASE 3: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_job_notes(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_job_note_rpc(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_customer_rpc(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer_rpc(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_rpc(TEXT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_part_catalogue_rpc(UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_part_catalogue_rpc(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parts_catalogue_rpc(TEXT, TEXT, INT, INT) TO authenticated, anon;