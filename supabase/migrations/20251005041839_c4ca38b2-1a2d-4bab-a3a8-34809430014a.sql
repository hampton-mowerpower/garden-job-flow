-- Phase 1: Core Tables for Reports & POS System

-- 1. Create app_role enum if it doesn't exist (for permissions)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'manager', 'technician', 'clerk', 'cashier');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Brands table (machinery manufacturers)
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  supplier TEXT,
  oem_export_required BOOLEAN DEFAULT false,
  oem_export_format TEXT CHECK (oem_export_format IN ('HONDA', 'HUSQVARNA', 'ECHO', 'GENERIC')),
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Machinery Models catalog
CREATE TABLE IF NOT EXISTS public.machinery_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  description TEXT,
  default_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  tax_code TEXT DEFAULT 'GST',
  requires_engine_serial BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Machinery Sales (warranty-ready records)
CREATE TABLE IF NOT EXISTS public.machinery_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.jobs_db(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) NOT NULL,
  model_id UUID REFERENCES public.machinery_models(id),
  model_name TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  engine_serial TEXT,
  purchase_date DATE NOT NULL,
  customer_id UUID REFERENCES public.customers_db(id) NOT NULL,
  price_ex_gst NUMERIC(10,2),
  price_incl_gst NUMERIC(10,2),
  salesperson_id UUID REFERENCES public.user_profiles(user_id),
  channel TEXT CHECK (channel IN ('POS', 'ONLINE', 'PHONE', 'SERVICE')),
  exported_at TIMESTAMPTZ,
  oem_export_status TEXT CHECK (oem_export_status IN ('NOT_EXPORTED', 'EXPORTED', 'ERROR')) DEFAULT 'NOT_EXPORTED',
  oem_export_errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(serial_number, brand_id)
);

-- 5. Invoice/Transaction header (enhanced jobs_db alternative for POS)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('SALE', 'QUOTE', 'SERVICE', 'REFUND')) DEFAULT 'SALE',
  customer_id UUID REFERENCES public.customers_db(id),
  job_id UUID REFERENCES public.jobs_db(id),
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('PERCENT', 'AMOUNT')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  surcharge_amount NUMERIC(10,2) DEFAULT 0,
  gst NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'VOID')) DEFAULT 'DRAFT',
  channel TEXT CHECK (channel IN ('POS', 'ONLINE', 'PHONE', 'SERVICE')) DEFAULT 'POS',
  notes TEXT,
  cashier_id UUID REFERENCES public.user_profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 6. Invoice Lines (line items for machinery, parts, labour)
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  line_type TEXT CHECK (line_type IN ('MACHINERY', 'PART', 'LABOUR', 'MISC')) NOT NULL,
  brand_id UUID REFERENCES public.brands(id),
  model_id UUID REFERENCES public.machinery_models(id),
  part_id UUID REFERENCES public.parts_catalogue(id),
  serial_number TEXT,
  engine_serial TEXT,
  technician_id UUID REFERENCES public.user_profiles(user_id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  tax_code TEXT DEFAULT 'GST',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Payments (enhanced from job_payments)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs_db(id),
  payment_method TEXT CHECK (payment_method IN ('CASH', 'CARD', 'EFTPOS', 'SPLIT', 'GIFT_CARD', 'STORE_CREDIT', 'ACCOUNT')) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  gst_component NUMERIC(10,2) DEFAULT 0,
  reference TEXT,
  card_last_four TEXT,
  terminal_id TEXT,
  notes TEXT,
  cashier_id UUID REFERENCES public.user_profiles(user_id),
  session_id UUID,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Cash Sessions (drawer management)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT UNIQUE NOT NULL,
  cashier_id UUID REFERENCES public.user_profiles(user_id) NOT NULL,
  terminal_id TEXT,
  opening_float NUMERIC(10,2) DEFAULT 0,
  closing_cash NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  over_short NUMERIC(10,2),
  total_sales NUMERIC(10,2) DEFAULT 0,
  total_refunds NUMERIC(10,2) DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  notes TEXT,
  reconciliation_summary JSONB
);

-- 9. Warranty Export Log (audit trail)
CREATE TABLE IF NOT EXISTS public.warranty_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) NOT NULL,
  export_format TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  records_count INTEGER DEFAULT 0,
  file_name TEXT,
  file_url TEXT,
  exported_by UUID REFERENCES public.user_profiles(user_id),
  status TEXT CHECK (status IN ('SUCCESS', 'PARTIAL', 'ERROR')) DEFAULT 'SUCCESS',
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands(active);
CREATE INDEX IF NOT EXISTS idx_machinery_models_brand ON public.machinery_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_machinery_models_sku ON public.machinery_models(sku);
CREATE INDEX IF NOT EXISTS idx_machinery_sales_brand ON public.machinery_sales(brand_id);
CREATE INDEX IF NOT EXISTS idx_machinery_sales_customer ON public.machinery_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_machinery_sales_purchase_date ON public.machinery_sales(purchase_date);
CREATE INDEX IF NOT EXISTS idx_machinery_sales_export_status ON public.machinery_sales(oem_export_status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON public.invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_type ON public.invoice_lines(line_type);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON public.payments(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_cashier ON public.cash_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using existing has_role and has_any_role functions)

-- Brands: All authenticated users can view, admin/manager can modify
CREATE POLICY "Authenticated users can view brands" ON public.brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and manager can insert brands" ON public.brands
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin and manager can update brands" ON public.brands
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin can delete brands" ON public.brands
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Machinery Models: Similar to brands
CREATE POLICY "Authenticated users can view models" ON public.machinery_models
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and manager can insert models" ON public.machinery_models
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin and manager can update models" ON public.machinery_models
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin can delete models" ON public.machinery_models
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Machinery Sales: All authenticated users can view, authorized roles can modify
CREATE POLICY "Authenticated users can view machinery sales" ON public.machinery_sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert machinery sales" ON public.machinery_sales
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Authorized roles can update machinery sales" ON public.machinery_sales
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin can delete machinery sales" ON public.machinery_sales
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Invoices: All authenticated users can view, authorized roles can modify
CREATE POLICY "Authenticated users can view invoices" ON public.invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Authorized roles can update invoices" ON public.invoices
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Admin can delete invoices" ON public.invoices
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Invoice Lines: Inherit invoice permissions
CREATE POLICY "Authenticated users can view invoice lines" ON public.invoice_lines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert invoice lines" ON public.invoice_lines
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Authorized roles can update invoice lines" ON public.invoice_lines
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Admin can delete invoice lines" ON public.invoice_lines
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Payments: All authenticated users can view, authorized roles can insert
CREATE POLICY "Authenticated users can view payments" ON public.payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert payments" ON public.payments
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager', 'cashier', 'clerk']));

CREATE POLICY "Admin and manager can update payments" ON public.payments
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin can delete payments" ON public.payments
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Cash Sessions: Cashiers can view own, managers can view all
CREATE POLICY "Cashiers can view own sessions" ON public.cash_sessions
  FOR SELECT USING (
    auth.uid() = cashier_id OR 
    has_any_role(auth.uid(), ARRAY['admin', 'manager'])
  );

CREATE POLICY "Cashiers can insert own sessions" ON public.cash_sessions
  FOR INSERT WITH CHECK (auth.uid() = cashier_id);

CREATE POLICY "Cashiers can update own sessions" ON public.cash_sessions
  FOR UPDATE USING (
    auth.uid() = cashier_id OR 
    has_any_role(auth.uid(), ARRAY['admin', 'manager'])
  );

-- Warranty Exports: Admin and manager only
CREATE POLICY "Admin and manager can view warranty exports" ON public.warranty_exports
  FOR SELECT USING (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

CREATE POLICY "Admin and manager can insert warranty exports" ON public.warranty_exports
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'manager']));

-- Triggers for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machinery_models_updated_at BEFORE UPDATE ON public.machinery_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machinery_sales_updated_at BEFORE UPDATE ON public.machinery_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();