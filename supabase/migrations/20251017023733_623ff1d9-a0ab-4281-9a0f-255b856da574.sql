-- PERFORMANCE OPTIMIZATION: Add critical indexes to fix timeout issues

-- ========================================
-- JOBS TABLE INDEXES (Critical for queries)
-- ========================================

-- Index on created_at for date range queries and sorting (DESC for recent-first)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON jobs_db(created_at DESC) WHERE deleted_at IS NULL;

-- Index on status for filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs_db(status) WHERE deleted_at IS NULL;

-- Index on customer_id for joins
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs_db(customer_id) WHERE deleted_at IS NULL;

-- Composite index for status + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs_db(status, created_at DESC) WHERE deleted_at IS NULL;

-- Index on quotation_status for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_quotation_status ON jobs_db(quotation_status) WHERE quotation_status IS NOT NULL AND deleted_at IS NULL;

-- ========================================
-- CUSTOMERS TABLE INDEXES
-- ========================================

-- Index on phone for customer lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers_db(phone) WHERE is_deleted = false;

-- Index on phone_digits for normalized phone search
CREATE INDEX IF NOT EXISTS idx_customers_phone_digits ON customers_db(phone_digits) WHERE is_deleted = false AND phone_digits IS NOT NULL;

-- Index on email for customer lookup
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers_db(email) WHERE is_deleted = false AND email IS NOT NULL;

-- Index on name_norm for name-based search
CREATE INDEX IF NOT EXISTS idx_customers_name_norm ON customers_db(name_norm) WHERE is_deleted = false;

-- ========================================
-- JOB PARTS TABLE INDEXES
-- ========================================

-- Index on job_id for lookups
CREATE INDEX IF NOT EXISTS idx_job_parts_job_id ON job_parts(job_id);

-- Index on awaiting_stock for filtering
CREATE INDEX IF NOT EXISTS idx_job_parts_awaiting_stock ON job_parts(job_id) WHERE awaiting_stock = true;

-- Index on part_id for parts catalog joins
CREATE INDEX IF NOT EXISTS idx_job_parts_part_id ON job_parts(part_id) WHERE part_id IS NOT NULL;

-- ========================================
-- JOB PAYMENTS TABLE INDEXES
-- ========================================

-- Index on job_id for payment lookups
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);

-- Index on paid_at for date filtering
CREATE INDEX IF NOT EXISTS idx_job_payments_paid_at ON job_payments(paid_at DESC);

-- ========================================
-- JOB NOTES TABLE INDEXES
-- ========================================

-- Index on job_id for note lookups
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON job_notes(job_id) WHERE deleted_at IS NULL;

-- Index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_job_notes_created_at ON job_notes(created_at DESC) WHERE deleted_at IS NULL;

-- ========================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ========================================

ANALYZE jobs_db;
ANALYZE customers_db;
ANALYZE job_parts;
ANALYZE job_payments;
ANALYZE job_notes;
ANALYZE parts_catalogue;