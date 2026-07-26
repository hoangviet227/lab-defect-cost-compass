
-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  shift TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_admin_hr_all" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "attendance_self_read" ON public.attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = attendance.employee_id AND ep.user_id = auth.uid()));
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Production outputs (khoán sản lượng)
CREATE TABLE public.production_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_outputs TO authenticated;
GRANT ALL ON public.production_outputs TO service_role;
ALTER TABLE public.production_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outputs_admin_hr_all" ON public.production_outputs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'production'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'production'));
CREATE POLICY "outputs_self_read" ON public.production_outputs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = production_outputs.employee_id AND ep.user_id = auth.uid()));
CREATE TRIGGER trg_outputs_updated BEFORE UPDATE ON public.production_outputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payroll periods
CREATE TABLE public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, closed
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_periods TO authenticated;
GRANT ALL ON public.payroll_periods TO service_role;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periods_admin_hr_all" ON public.payroll_periods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE TRIGGER trg_periods_updated BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslips
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
  allowance NUMERIC(14,2) NOT NULL DEFAULT 0,
  worked_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  output_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(14,2) NOT NULL DEFAULT 0,
  deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
  advance NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payslips TO authenticated;
GRANT ALL ON public.payslips TO service_role;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payslips_admin_hr_all" ON public.payslips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "payslips_self_read" ON public.payslips FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.id = payslips.employee_id AND ep.user_id = auth.uid()));
CREATE TRIGGER trg_payslips_updated BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: generate payslips for a period from attendance + outputs
CREATE OR REPLACE FUNCTION public.generate_payslips(_period_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period public.payroll_periods;
  v_emp RECORD;
  v_hours NUMERIC(8,2);
  v_output NUMERIC(14,2);
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant')) THEN
    RAISE EXCEPTION 'Không có quyền tạo bảng lương';
  END IF;
  SELECT * INTO v_period FROM public.payroll_periods WHERE id = _period_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy kỳ lương'; END IF;
  IF v_period.status <> 'draft' THEN RAISE EXCEPTION 'Kỳ lương đã chốt'; END IF;

  FOR v_emp IN SELECT * FROM public.employee_profiles WHERE is_active IS NOT FALSE LOOP
    SELECT COALESCE(SUM(hours),0) INTO v_hours FROM public.attendance
      WHERE employee_id = v_emp.id AND work_date BETWEEN v_period.start_date AND v_period.end_date;
    SELECT COALESCE(SUM(amount),0) INTO v_output FROM public.production_outputs
      WHERE employee_id = v_emp.id AND work_date BETWEEN v_period.start_date AND v_period.end_date;
    INSERT INTO public.payslips(period_id, employee_id, base_salary, allowance, worked_hours, output_amount, net_pay)
      VALUES (_period_id, v_emp.id, COALESCE(v_emp.base_salary,0), COALESCE(v_emp.allowance,0), v_hours, v_output,
              COALESCE(v_emp.base_salary,0) + COALESCE(v_emp.allowance,0) + v_output)
      ON CONFLICT (period_id, employee_id) DO UPDATE
        SET base_salary = EXCLUDED.base_salary,
            allowance = EXCLUDED.allowance,
            worked_hours = EXCLUDED.worked_hours,
            output_amount = EXCLUDED.output_amount,
            net_pay = EXCLUDED.base_salary + EXCLUDED.allowance + EXCLUDED.output_amount
                      + public.payslips.bonus - public.payslips.deduction - public.payslips.advance,
            updated_at = now();
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END; $$;

REVOKE ALL ON FUNCTION public.generate_payslips(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_payslips(UUID) TO authenticated;

-- RPC: close a payroll period (freeze)
CREATE OR REPLACE FUNCTION public.close_payroll_period(_period_id UUID)
RETURNS public.payroll_periods
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_period public.payroll_periods;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant')) THEN
    RAISE EXCEPTION 'Không có quyền chốt kỳ lương';
  END IF;
  UPDATE public.payroll_periods
     SET status = 'closed', closed_by = auth.uid(), closed_at = now(), updated_at = now()
   WHERE id = _period_id AND status = 'draft'
   RETURNING * INTO v_period;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kỳ lương không tồn tại hoặc đã chốt'; END IF;
  RETURN v_period;
END; $$;

REVOKE ALL ON FUNCTION public.close_payroll_period(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_payroll_period(UUID) TO authenticated;

-- Ensure employee_profiles has salary columns (safe adds)
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowance NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
