
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ app_settings ============
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_name TEXT NOT NULL DEFAULT 'Xưởng In Manager',
  workshop_address TEXT,
  workshop_phone TEXT,
  workshop_email TEXT,
  workshop_tax_code TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'VND',
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  roll_width_mm NUMERIC(10,2) NOT NULL DEFAULT 600,
  roll_length_rounding_mm NUMERIC(10,2) NOT NULL DEFAULT 10,
  allow_negative_stock BOOLEAN NOT NULL DEFAULT false,
  low_price_variance_percent NUMERIC(6,2) NOT NULL DEFAULT 20,
  is_singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings readable by authenticated" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings admin write" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.app_settings (workshop_name) VALUES ('Xưởng In Manager')
  ON CONFLICT DO NOTHING;

-- ============ sequence_counters + next_sequence ============
CREATE TABLE IF NOT EXISTS public.sequence_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT '',
  last_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prefix, period)
);
GRANT SELECT ON public.sequence_counters TO authenticated;
GRANT ALL ON public.sequence_counters TO service_role;
ALTER TABLE public.sequence_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sequence_counters admin read" ON public.sequence_counters
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.next_sequence(
  _prefix TEXT,
  _period TEXT DEFAULT '',
  _pad INT DEFAULT 4
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next BIGINT;
  v_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.sequence_counters (prefix, period, last_value)
    VALUES (_prefix, _period, 1)
    ON CONFLICT (prefix, period)
    DO UPDATE SET last_value = public.sequence_counters.last_value + 1,
                  updated_at = now()
    RETURNING last_value INTO v_next;
  IF _period = '' THEN
    v_code := _prefix || '-' || LPAD(v_next::TEXT, _pad, '0');
  ELSE
    v_code := _prefix || '-' || _period || '-' || LPAD(v_next::TEXT, _pad, '0');
  END IF;
  RETURN v_code;
END;
$$;
REVOKE ALL ON FUNCTION public.next_sequence(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_sequence(TEXT, TEXT, INT) TO authenticated, service_role;

-- ============ current_user_roles helper ============
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role::TEXT), ARRAY[]::TEXT[])
  FROM public.user_roles
  WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.current_user_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated, service_role;

-- ============ customer_tiers ============
CREATE TABLE IF NOT EXISTS public.customer_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT ON public.customer_tiers TO authenticated;
GRANT ALL ON public.customer_tiers TO service_role;
ALTER TABLE public.customer_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_tiers readable" ON public.customer_tiers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "customer_tiers admin write" ON public.customer_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_customer_tiers_updated_at BEFORE UPDATE ON public.customer_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.customer_tiers (code, name, discount_percent, sort_order) VALUES
  ('RETAIL', 'Khách lẻ', 0, 0),
  ('AGENT1', 'Đại lý cấp 1', 5, 1),
  ('AGENT2', 'Đại lý cấp 2', 10, 2),
  ('AGENT3', 'Đại lý cấp 3', 15, 3)
ON CONFLICT (code) DO NOTHING;

-- ============ customers ============
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  customer_type TEXT NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail','agent')),
  tier_id UUID REFERENCES public.customer_tiers(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  tax_code TEXT,
  credit_limit NUMERIC(18,2) NOT NULL DEFAULT 0,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers staff read" ON public.customers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'sales')
    OR public.has_role(auth.uid(), 'warehouse')
    OR public.has_role(auth.uid(), 'production')
    OR public.has_role(auth.uid(), 'accountant')
    OR public.has_role(auth.uid(), 'delivery')
  );
CREATE POLICY "customers sales insert" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales'));
CREATE POLICY "customers sales update" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales'));
CREATE POLICY "customers admin delete" ON public.customers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ suppliers ============
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  tax_code TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers staff read" ON public.suppliers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'warehouse')
    OR public.has_role(auth.uid(), 'accountant')
    OR public.has_role(auth.uid(), 'sales')
    OR public.has_role(auth.uid(), 'production')
  );
CREATE POLICY "suppliers warehouse insert" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));
CREATE POLICY "suppliers warehouse update" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));
CREATE POLICY "suppliers admin delete" ON public.suppliers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ employee_profiles ============
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL UNIQUE,
  join_date DATE,
  base_salary NUMERIC(18,2) NOT NULL DEFAULT 0,
  daily_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  shift_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  bank_account TEXT,
  bank_name TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_active ON public.employee_profiles(is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_profiles TO authenticated;
GRANT ALL ON public.employee_profiles TO service_role;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_profiles self read" ON public.employee_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'accountant')
  );
CREATE POLICY "employee_profiles admin write" ON public.employee_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ activity_logs ============
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs admin read" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "activity_logs self insert" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (recipient_user_id IS NOT NULL OR customer_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON public.notifications(customer_id, is_read);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications recipient read" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
CREATE POLICY "notifications recipient mark read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- ============ Tighten user_roles: only admin writes ============
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ Lock down security-definer helpers ============
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
