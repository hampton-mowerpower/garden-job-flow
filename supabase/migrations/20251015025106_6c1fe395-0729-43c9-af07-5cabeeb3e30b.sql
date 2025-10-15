-- Normalization helpers
CREATE OR REPLACE FUNCTION norm_text(t TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT regexp_replace(lower(trim(coalesce(t,''))), '\s+', ' ', 'g')
$$;

CREATE OR REPLACE FUNCTION digits_only(t TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT regexp_replace(coalesce(t,''), '\D', '', 'g')
$$;

-- Add normalized search columns to jobs_db (only for fields that exist)
ALTER TABLE jobs_db
  ADD COLUMN IF NOT EXISTS job_number_norm TEXT GENERATED ALWAYS AS (norm_text(job_number)) STORED,
  ADD COLUMN IF NOT EXISTS job_number_digits TEXT GENERATED ALWAYS AS (digits_only(job_number)) STORED,
  ADD COLUMN IF NOT EXISTS model_norm TEXT GENERATED ALWAYS AS (norm_text(machine_model)) STORED,
  ADD COLUMN IF NOT EXISTS brand_norm TEXT GENERATED ALWAYS AS (norm_text(machine_brand)) STORED,
  ADD COLUMN IF NOT EXISTS serial_norm TEXT GENERATED ALWAYS AS (norm_text(machine_serial)) STORED,
  ADD COLUMN IF NOT EXISTS category_norm TEXT GENERATED ALWAYS AS (norm_text(machine_category)) STORED;

-- Add normalized columns to customers_db for search
ALTER TABLE customers_db
  ADD COLUMN IF NOT EXISTS name_norm TEXT GENERATED ALWAYS AS (norm_text(name)) STORED,
  ADD COLUMN IF NOT EXISTS email_norm TEXT GENERATED ALWAYS AS (norm_text(email)) STORED,
  ADD COLUMN IF NOT EXISTS phone_digits TEXT GENERATED ALWAYS AS (digits_only(phone)) STORED;

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search indexes on jobs_db
CREATE INDEX IF NOT EXISTS ix_jobs_job_number ON jobs_db(job_number);
CREATE INDEX IF NOT EXISTS ix_jobs_job_number_digits ON jobs_db(job_number_digits);
CREATE INDEX IF NOT EXISTS ix_jobs_job_number_trgm ON jobs_db USING gin (job_number_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_jobs_model_trgm ON jobs_db USING gin (model_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_jobs_brand_trgm ON jobs_db USING gin (brand_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_jobs_serial_trgm ON jobs_db USING gin (serial_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_jobs_category_norm ON jobs_db(category_norm);
CREATE INDEX IF NOT EXISTS ix_jobs_customer_id ON jobs_db(customer_id);
CREATE INDEX IF NOT EXISTS ix_jobs_tenant_id ON jobs_db(tenant_id);
CREATE INDEX IF NOT EXISTS ix_jobs_status ON jobs_db(status);
CREATE INDEX IF NOT EXISTS ix_jobs_deleted_at ON jobs_db(deleted_at) WHERE deleted_at IS NULL;

-- Create search indexes on customers_db
CREATE INDEX IF NOT EXISTS ix_customers_name_trgm ON customers_db USING gin (name_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_customers_email_norm ON customers_db(email_norm);
CREATE INDEX IF NOT EXISTS ix_customers_phone_digits ON customers_db(phone_digits);
CREATE INDEX IF NOT EXISTS ix_customers_deleted ON customers_db(is_deleted) WHERE is_deleted = false;

-- Unified search function (tenant-scoped, fast, tolerant)
CREATE OR REPLACE FUNCTION search_jobs_unified(
  p_query TEXT,
  p_limit INTEGER DEFAULT 50,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  job_number TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  grand_total NUMERIC,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  machine_category TEXT,
  machine_brand TEXT,
  machine_model TEXT,
  machine_serial TEXT,
  problem_description TEXT,
  balance_due NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT 
      norm_text(p_query) AS q_norm,
      digits_only(p_query) AS q_digits,
      lower(trim(p_query)) AS q_lower
  )
  SELECT 
    j.id,
    j.job_number,
    j.status,
    j.created_at,
    j.grand_total,
    j.customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    j.machine_category,
    j.machine_brand,
    j.machine_model,
    j.machine_serial,
    j.problem_description,
    j.balance_due
  FROM jobs_db j
  LEFT JOIN customers_db c ON c.id = j.customer_id AND c.is_deleted = false
  CROSS JOIN normalized n
  WHERE j.deleted_at IS NULL
    AND (p_tenant_id IS NULL OR j.tenant_id = p_tenant_id)
    AND (
      -- Job number: exact, digits, or contains
      j.job_number = p_query
      OR j.job_number_digits = n.q_digits
      OR j.job_number_norm LIKE n.q_norm || '%'
      OR j.job_number_norm LIKE '%' || n.q_norm || '%'
      
      -- Customer: name prefix/contains, email exact, phone prefix
      OR c.name_norm LIKE n.q_norm || '%'
      OR c.name_norm LIKE '%' || n.q_norm || '%'
      OR c.email_norm = n.q_norm
      OR c.phone_digits LIKE n.q_digits || '%'
      
      -- Machine: model/brand/serial prefix or contains
      OR j.model_norm LIKE n.q_norm || '%'
      OR j.model_norm LIKE '%' || n.q_norm || '%'
      OR j.brand_norm LIKE n.q_norm || '%'
      OR j.brand_norm LIKE '%' || n.q_norm || '%'
      OR j.serial_norm LIKE n.q_norm || '%'
      OR j.serial_norm LIKE '%' || n.q_norm || '%'
      OR j.category_norm LIKE n.q_norm || '%'
    )
  ORDER BY 
    -- Exact job number match first
    CASE WHEN j.job_number = p_query THEN 0 ELSE 1 END,
    -- Then by recency
    j.created_at DESC
  LIMIT p_limit;
$$;