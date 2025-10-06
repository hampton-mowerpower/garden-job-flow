-- Phase 2A: Additional tables for Reports, POS, Account Customers, User Management

-- Categories table (for machinery and parts)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  rate_default NUMERIC DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Category common brands (tokenized chips)
CREATE TABLE public.category_common_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  free_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT brand_or_free_text CHECK (
    (brand_id IS NOT NULL AND free_text IS NULL) OR
    (brand_id IS NULL AND free_text IS NOT NULL)
  )
);

-- Quick problem descriptions
CREATE TABLE public.quick_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Account customers
CREATE TABLE public.account_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  phone TEXT,
  default_payment_terms TEXT DEFAULT '30 days',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Account customer messages (reminders, billing, quotes)
CREATE TABLE public.account_customer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_customer_id UUID NOT NULL REFERENCES public.account_customers(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('reminder', 'collection', 'billing', 'quote')),
  payload JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transport charge configuration
CREATE TABLE public.transport_charge_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  small_medium_base NUMERIC DEFAULT 15,
  large_base NUMERIC DEFAULT 30,
  included_km NUMERIC DEFAULT 5,
  per_km_rate NUMERIC DEFAULT 5,
  origin_address TEXT DEFAULT '87 Ludstone Street, Hampton VIC 3188',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default transport config
INSERT INTO public.transport_charge_configs (id, small_medium_base, large_base, included_km, per_km_rate, origin_address)
VALUES (gen_random_uuid(), 15, 30, 5, 5, '87 Ludstone Street, Hampton VIC 3188');

-- Machine category size mapping
CREATE TABLE public.machine_category_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  size_tier TEXT NOT NULL CHECK (size_tier IN ('SMALL_MEDIUM', 'LARGE')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed machine category mappings
INSERT INTO public.machine_category_map (category_name, size_tier) VALUES
  ('chainsaw', 'SMALL_MEDIUM'),
  ('lawn mower', 'SMALL_MEDIUM'),
  ('blower', 'SMALL_MEDIUM'),
  ('trimmer', 'SMALL_MEDIUM'),
  ('brushcutter', 'SMALL_MEDIUM'),
  ('multi-tool', 'SMALL_MEDIUM'),
  ('shredder', 'LARGE'),
  ('cylinder mower', 'LARGE'),
  ('ride-on', 'LARGE'),
  ('floor saw', 'LARGE'),
  ('chipper', 'LARGE');

-- User table layouts (for column reordering)
CREATE TABLE public.user_table_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_key TEXT NOT NULL,
  column_order JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_key)
);

-- User approvals (for user management workflow)
CREATE TABLE public.user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  approved_by UUID NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  meta JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update user_profiles to include status enum
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' 
  CHECK (status IN ('PENDING', 'APPROVED', 'VERIFIED', 'ACTIVE', 'SUSPENDED'));

-- Add account_customer_id to jobs_db
ALTER TABLE public.jobs_db 
  ADD COLUMN IF NOT EXISTS account_customer_id UUID REFERENCES public.account_customers(id) ON DELETE SET NULL;

-- Add additional_notes to jobs_db if not exists
ALTER TABLE public.jobs_db 
  ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Update parts_catalogue to include category_id and brand_id
ALTER TABLE public.parts_catalogue 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_categories_display_order ON public.categories(display_order);
CREATE INDEX idx_category_brands_category ON public.category_common_brands(category_id);
CREATE INDEX idx_category_brands_order ON public.category_common_brands(display_order);
CREATE INDEX idx_quick_problems_order ON public.quick_problems(display_order);
CREATE INDEX idx_account_customers_name ON public.account_customers(name);
CREATE INDEX idx_account_messages_customer ON public.account_customer_messages(account_customer_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_user_layouts_user ON public.user_table_layouts(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_problems_updated_at BEFORE UPDATE ON public.quick_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_customers_updated_at BEFORE UPDATE ON public.account_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_configs_updated_at BEFORE UPDATE ON public.transport_charge_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_table_layouts_updated_at BEFORE UPDATE ON public.user_table_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_common_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_charge_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_category_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_table_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Categories
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Admin and counter can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

CREATE POLICY "Admin can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies: Category Common Brands
CREATE POLICY "Authenticated users can view category brands"
  ON public.category_common_brands FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can manage category brands"
  ON public.category_common_brands FOR ALL
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- RLS Policies: Quick Problems
CREATE POLICY "Authenticated users can view quick problems"
  ON public.quick_problems FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can manage quick problems"
  ON public.quick_problems FOR ALL
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- RLS Policies: Account Customers
CREATE POLICY "Authenticated users can view account customers"
  ON public.account_customers FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can manage account customers"
  ON public.account_customers FOR ALL
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- RLS Policies: Account Customer Messages
CREATE POLICY "Authenticated users can view account messages"
  ON public.account_customer_messages FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and counter can manage account messages"
  ON public.account_customer_messages FOR ALL
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'counter']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin', 'counter']));

-- RLS Policies: Transport Config
CREATE POLICY "Authenticated users can view transport config"
  ON public.transport_charge_configs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage transport config"
  ON public.transport_charge_configs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies: Machine Category Map
CREATE POLICY "Authenticated users can view machine category map"
  ON public.machine_category_map FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage machine category map"
  ON public.machine_category_map FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies: User Table Layouts
CREATE POLICY "Users can manage own table layouts"
  ON public.user_table_layouts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: User Approvals
CREATE POLICY "Admin can view all approvals"
  ON public.user_approvals FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage approvals"
  ON public.user_approvals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies: Audit Logs
CREATE POLICY "Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for parts and related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_catalogue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_common_brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_problems;

-- Set replica identity for realtime
ALTER TABLE public.parts_catalogue REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.category_common_brands REPLICA IDENTITY FULL;
ALTER TABLE public.quick_problems REPLICA IDENTITY FULL;