-- Create user profiles table with roles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'counter' CHECK (role IN ('admin', 'technician', 'counter')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers_db (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parts catalogue table
CREATE TABLE public.parts_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  upc TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2) NOT NULL,
  markup DECIMAL(5,2),
  competitor_price DECIMAL(10,2),
  source TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs_db (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers_db(id),
  machine_category TEXT NOT NULL,
  machine_brand TEXT NOT NULL,
  machine_model TEXT NOT NULL,
  machine_serial TEXT,
  problem_description TEXT NOT NULL,
  notes TEXT,
  service_performed TEXT,
  recommendations TEXT,
  service_deposit DECIMAL(10,2),
  quotation_amount DECIMAL(10,2),
  parts_required TEXT,
  labour_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  labour_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  parts_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  labour_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'delivered')),
  assigned_technician UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create job_parts junction table
CREATE TABLE public.job_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts_catalogue(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_parts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_jobs_customer_id ON public.jobs_db(customer_id);
CREATE INDEX idx_jobs_status ON public.jobs_db(status);
CREATE INDEX idx_jobs_assigned_technician ON public.jobs_db(assigned_technician);
CREATE INDEX idx_job_parts_job_id ON public.job_parts(job_id);
CREATE INDEX idx_job_parts_part_id ON public.job_parts(part_id);
CREATE INDEX idx_parts_catalogue_sku ON public.parts_catalogue(sku);
CREATE INDEX idx_parts_catalogue_category ON public.parts_catalogue(category);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for customers_db
CREATE POLICY "Authenticated users can view customers" ON public.customers_db FOR SELECT TO authenticated USING (true);
CREATE POLICY "Counter and admin can insert customers" ON public.customers_db FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'counter'))
);
CREATE POLICY "Counter and admin can update customers" ON public.customers_db FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'counter'))
);
CREATE POLICY "Admin can delete customers" ON public.customers_db FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for parts_catalogue
CREATE POLICY "Authenticated users can view parts" ON public.parts_catalogue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage parts" ON public.parts_catalogue FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for jobs_db
CREATE POLICY "Authenticated users can view jobs" ON public.jobs_db FOR SELECT TO authenticated USING (true);
CREATE POLICY "Technicians and counter can insert jobs" ON public.jobs_db FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'technician', 'counter'))
);
CREATE POLICY "Technicians and counter can update jobs" ON public.jobs_db FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'technician', 'counter'))
);
CREATE POLICY "Admin can delete jobs" ON public.jobs_db FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for job_parts
CREATE POLICY "Authenticated users can view job parts" ON public.job_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Technicians can manage job parts" ON public.job_parts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'technician'))
);

-- Create reporting functions
CREATE OR REPLACE FUNCTION get_daily_takings(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  total_jobs BIGINT,
  total_revenue DECIMAL,
  average_job_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.created_at::DATE as date,
    COUNT(j.id) as total_jobs,
    COALESCE(SUM(j.grand_total), 0) as total_revenue,
    COALESCE(AVG(j.grand_total), 0) as average_job_value
  FROM jobs_db j
  WHERE j.created_at::DATE BETWEEN start_date AND end_date
    AND j.status = 'completed'
  GROUP BY j.created_at::DATE
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_technician_productivity(start_date DATE, end_date DATE, filter_technician_id UUID DEFAULT NULL)
RETURNS TABLE (
  technician_id UUID,
  technician_name TEXT,
  jobs_completed BIGINT,
  total_revenue DECIMAL,
  average_job_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as technician_id,
    up.full_name as technician_name,
    COUNT(j.id) as jobs_completed,
    COALESCE(SUM(j.grand_total), 0) as total_revenue,
    COALESCE(AVG(EXTRACT(epoch FROM (j.completed_at - j.created_at))/3600), 0) as average_job_time
  FROM user_profiles up
  LEFT JOIN jobs_db j ON j.assigned_technician = up.id
  WHERE up.role = 'technician'
    AND (filter_technician_id IS NULL OR up.id = filter_technician_id)
    AND (j.created_at IS NULL OR j.created_at::DATE BETWEEN start_date AND end_date)
    AND (j.status IS NULL OR j.status = 'completed')
  GROUP BY up.id, up.full_name
  ORDER BY jobs_completed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_parts_usage_report(start_date DATE, end_date DATE)
RETURNS TABLE (
  part_id UUID,
  part_name TEXT,
  sku TEXT,
  total_quantity BIGINT,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as part_id,
    p.name as part_name,
    p.sku,
    COALESCE(SUM(jp.quantity), 0) as total_quantity,
    COALESCE(SUM(jp.total_price), 0) as total_value
  FROM parts_catalogue p
  LEFT JOIN job_parts jp ON jp.part_id = p.id
  LEFT JOIN jobs_db j ON j.id = jp.job_id
  WHERE j.created_at IS NULL OR j.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY p.id, p.name, p.sku
  HAVING COALESCE(SUM(jp.quantity), 0) > 0
  ORDER BY total_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_db_updated_at BEFORE UPDATE ON public.customers_db FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_catalogue_updated_at BEFORE UPDATE ON public.parts_catalogue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_db_updated_at BEFORE UPDATE ON public.jobs_db FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'counter'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();