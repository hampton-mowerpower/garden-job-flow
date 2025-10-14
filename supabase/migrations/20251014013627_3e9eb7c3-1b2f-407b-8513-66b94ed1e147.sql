-- Add job_type field to jobs_db table
ALTER TABLE jobs_db 
ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'service' CHECK (job_type IN ('service', 'small_repair'));

-- Create index for job_type queries
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs_db(job_type);

-- Create job_sales_items table for unpaid sales tracking
CREATE TABLE IF NOT EXISTS job_sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers_db(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('new_mower', 'parts', 'accessories', 'other')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  collect_with_job BOOLEAN DEFAULT false,
  paid_status TEXT DEFAULT 'unpaid' CHECK (paid_status IN ('unpaid', 'paid')),
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on job_sales_items
ALTER TABLE job_sales_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_sales_items
CREATE POLICY "Authenticated users can view job sales items"
  ON job_sales_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert job sales items"
  ON job_sales_items FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']));

CREATE POLICY "Authorized roles can update job sales items"
  ON job_sales_items FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'technician', 'counter']));

CREATE POLICY "Admins can delete job sales items"
  ON job_sales_items FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_sales_items_job_id ON job_sales_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_sales_items_customer_id ON job_sales_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_sales_items_paid_status ON job_sales_items(paid_status);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_sales_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_sales_items_updated_at
  BEFORE UPDATE ON job_sales_items
  FOR EACH ROW
  EXECUTE FUNCTION update_job_sales_items_updated_at();

-- Add comment to tables for documentation
COMMENT ON TABLE job_sales_items IS 'Tracks items sold to customers (mowers, parts, etc.) that can be paid with service jobs';
COMMENT ON COLUMN jobs_db.job_type IS 'Type of job: service (regular repair) or small_repair (sharpening/quick jobs)';