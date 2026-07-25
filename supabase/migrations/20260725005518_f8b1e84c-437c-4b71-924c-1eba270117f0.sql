
-- Enums
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('draft','confirmed','in_production','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.production_status AS ENUM ('pending','in_progress','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_issue_status AS ENUM ('draft','confirmed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  tier_id UUID REFERENCES public.customer_tiers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status public.order_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_read_auth" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_manage" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  width_cm NUMERIC(10,2),
  height_cm NUMERIC(10,2),
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_read_auth" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_items_manage" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'));

-- Production
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id),
  assigned_to UUID REFERENCES auth.users(id),
  start_date DATE,
  end_date DATE,
  status public.production_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders TO authenticated;
GRANT ALL ON public.production_orders TO service_role;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_read_auth" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "po_manage" ON public.production_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'production'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'production'));
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.production_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  planned_qty NUMERIC(14,3) NOT NULL CHECK (planned_qty > 0),
  produced_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_order_items TO authenticated;
GRANT ALL ON public.production_order_items TO service_role;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poi_read_auth" ON public.production_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "poi_manage" ON public.production_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'production'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'production'));

-- Stock issue
CREATE TABLE public.stock_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  status public.stock_issue_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_issues TO authenticated;
GRANT ALL ON public.stock_issues TO service_role;
ALTER TABLE public.stock_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "si_read_auth" ON public.stock_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "si_manage" ON public.stock_issues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));
CREATE TRIGGER trg_si_updated BEFORE UPDATE ON public.stock_issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stock_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_issue_id UUID NOT NULL REFERENCES public.stock_issues(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_issue_items TO authenticated;
GRANT ALL ON public.stock_issue_items TO service_role;
ALTER TABLE public.stock_issue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sii_read_auth" ON public.stock_issue_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "sii_manage" ON public.stock_issue_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));

-- RPCs
CREATE OR REPLACE FUNCTION public.confirm_order(_order_id UUID)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders; v_total NUMERIC(14,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales')) THEN
    RAISE EXCEPTION 'Không có quyền xác nhận đơn';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy đơn'; END IF;
  IF v_order.status <> 'draft' THEN RAISE EXCEPTION 'Đơn đã ở trạng thái %', v_order.status; END IF;

  UPDATE public.order_items SET line_total = quantity * unit_price WHERE order_id = _order_id;
  SELECT COALESCE(SUM(line_total),0) INTO v_total FROM public.order_items WHERE order_id = _order_id;

  UPDATE public.orders
     SET subtotal = v_total,
         total_amount = GREATEST(v_total - COALESCE(discount,0), 0),
         status = 'confirmed',
         confirmed_by = auth.uid(),
         confirmed_at = now(),
         updated_at = now()
   WHERE id = _order_id RETURNING * INTO v_order;
  RETURN v_order;
END; $$;

CREATE OR REPLACE FUNCTION public.create_production_from_order(_order_id UUID)
RETURNS public.production_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_po public.production_orders; v_code TEXT; v_item RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'production') OR public.has_role(auth.uid(),'sales')) THEN
    RAISE EXCEPTION 'Không có quyền tạo lệnh sản xuất';
  END IF;
  v_code := public.next_sequence('LSX', to_char(now(),'YYYYMM'), 4);
  INSERT INTO public.production_orders(code, order_id, status, created_by)
    VALUES (v_code, _order_id, 'pending', auth.uid())
    RETURNING * INTO v_po;
  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = _order_id LOOP
    INSERT INTO public.production_order_items(production_order_id, product_id, planned_qty)
      VALUES (v_po.id, v_item.product_id, v_item.quantity);
  END LOOP;
  UPDATE public.orders SET status = 'in_production', updated_at = now() WHERE id = _order_id AND status = 'confirmed';
  RETURN v_po;
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_stock_issue(_issue_id UUID)
RETURNS public.stock_issues LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_issue public.stock_issues; v_item RECORD; v_available NUMERIC(14,3); v_cost NUMERIC(14,2); v_total NUMERIC(14,2) := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse')) THEN
    RAISE EXCEPTION 'Không có quyền xác nhận xuất kho';
  END IF;
  SELECT * INTO v_issue FROM public.stock_issues WHERE id = _issue_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy phiếu'; END IF;
  IF v_issue.status <> 'draft' THEN RAISE EXCEPTION 'Phiếu đã ở trạng thái %', v_issue.status; END IF;

  FOR v_item IN SELECT * FROM public.stock_issue_items WHERE stock_issue_id = _issue_id LOOP
    SELECT quantity INTO v_available FROM public.stock_balances
      WHERE material_id = v_item.material_id AND warehouse_id = v_issue.warehouse_id FOR UPDATE;
    IF v_available IS NULL OR v_available < v_item.quantity THEN
      RAISE EXCEPTION 'Không đủ tồn cho vật tư %', v_item.material_id;
    END IF;
    SELECT avg_cost INTO v_cost FROM public.materials WHERE id = v_item.material_id;
    UPDATE public.stock_issue_items
       SET unit_cost = v_cost, line_total = v_cost * quantity
     WHERE id = v_item.id;
    v_total := v_total + v_cost * v_item.quantity;

    UPDATE public.stock_balances
       SET quantity = quantity - v_item.quantity, updated_at = now()
     WHERE material_id = v_item.material_id AND warehouse_id = v_issue.warehouse_id;

    INSERT INTO public.stock_transactions(material_id, warehouse_id, txn_type, quantity, unit_cost, ref_table, ref_id, performed_by, notes)
      VALUES (v_item.material_id, v_issue.warehouse_id, 'out', v_item.quantity, v_cost, 'stock_issues', _issue_id, auth.uid(), 'Xuất kho từ phiếu ' || v_issue.code);
  END LOOP;

  UPDATE public.stock_issues
     SET status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(),
         total_amount = v_total, updated_at = now()
   WHERE id = _issue_id RETURNING * INTO v_issue;
  RETURN v_issue;
END; $$;

REVOKE ALL ON FUNCTION public.confirm_order(UUID), public.create_production_from_order(UUID), public.confirm_stock_issue(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order(UUID), public.create_production_from_order(UUID), public.confirm_stock_issue(UUID) TO authenticated;
