-- ============================================
-- Create RPC functions to load machine reference data
-- ============================================

-- Function to get all active categories for dropdown
CREATE OR REPLACE FUNCTION public.get_machine_categories()
RETURNS TABLE (
  id uuid,
  name text,
  display_order int,
  rate_default numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, display_order, rate_default
  FROM categories
  WHERE active = true
  ORDER BY display_order, name;
$$;

-- Function to get brands for a specific category (or all if NULL)
CREATE OR REPLACE FUNCTION public.get_machine_brands(
  p_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  category_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, category_id
  FROM brands
  WHERE active = true
    AND (p_category_id IS NULL OR category_id = p_category_id)
  ORDER BY name;
$$;

-- Function to get models for a specific brand (or all if NULL)
CREATE OR REPLACE FUNCTION public.get_machine_models(
  p_brand_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  brand_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, brand_id
  FROM machinery_models
  WHERE active = true
    AND (p_brand_id IS NULL OR brand_id = p_brand_id)
  ORDER BY name;
$$;

-- Function to get complete job details with all related data
CREATE OR REPLACE FUNCTION public.get_job_details(
  p_job_id uuid
)
RETURNS TABLE (
  -- Job fields
  id uuid,
  job_number text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  
  -- Customer fields
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  customer_suburb text,
  customer_postcode text,
  
  -- Machine fields
  machine_category text,
  machine_brand text,
  machine_model text,
  machine_serial text,
  
  -- Problem & notes
  problem_description text,
  notes text,
  service_performed text,
  recommendations text,
  additional_notes text,
  
  -- Pricing
  labour_hours numeric,
  labour_rate numeric,
  labour_total numeric,
  parts_subtotal numeric,
  subtotal numeric,
  gst numeric,
  grand_total numeric,
  service_deposit numeric,
  quotation_amount numeric,
  balance_due numeric,
  
  -- Transport & services
  transport_pickup_required boolean,
  transport_delivery_required boolean,
  transport_total_charge numeric,
  sharpen_total_charge numeric,
  small_repair_total numeric,
  
  -- Other fields
  assigned_technician uuid,
  quotation_status text,
  requested_finish_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Job fields
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.updated_at,
    j.completed_at,
    
    -- Customer fields (via JOIN)
    j.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    c.address AS customer_address,
    c.suburb AS customer_suburb,
    c.postcode AS customer_postcode,
    
    -- Machine fields
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    
    -- Problem & notes
    j.problem_description,
    j.notes,
    j.service_performed,
    j.recommendations,
    j.additional_notes,
    
    -- Pricing
    j.labour_hours,
    j.labour_rate,
    j.labour_total,
    j.parts_subtotal,
    j.subtotal,
    j.gst,
    j.grand_total,
    j.service_deposit,
    j.quotation_amount,
    j.balance_due,
    
    -- Transport & services
    j.transport_pickup_required,
    j.transport_delivery_required,
    j.transport_total_charge,
    j.sharpen_total_charge,
    j.small_repair_total,
    
    -- Other fields
    j.assigned_technician,
    j.quotation_status,
    j.requested_finish_date
    
  FROM jobs_db j
  LEFT JOIN customers_db c ON c.id = j.customer_id
  WHERE j.id = p_job_id
    AND j.deleted_at IS NULL;
$$;