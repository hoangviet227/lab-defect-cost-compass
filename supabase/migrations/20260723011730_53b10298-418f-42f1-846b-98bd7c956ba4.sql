
-- ============ MATERIAL CATEGORIES ============
CREATE TABLE public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_categories TO authenticated;
GRANT ALL ON public.material_categories TO service_role;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read material_categories" ON public.material_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/warehouse manage material_categories" ON public.material_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));
CREATE TRIGGER trg_material_categories_updated BEFORE UPDATE ON public.material_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WAREHOUSES ============
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/warehouse manage warehouses" ON public.warehouses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));
CREATE TRIGGER trg_warehouses_updated BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MATERIALS ============
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'cái',
  width_cm NUMERIC(10,2),
  thickness_mm NUMERIC(10,2),
  min_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  avg_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  default_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/warehouse manage materials" ON public.materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STOCK BALANCES ============
CREATE TABLE public.stock_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(material_id, warehouse_id)
);
GRANT SELECT ON public.stock_balances TO authenticated;
GRANT ALL ON public.stock_balances TO service_role;
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read stock_balances" ON public.stock_balances FOR SELECT TO authenticated USING (true);

-- ============ STOCK TRANSACTIONS ============
CREATE TYPE public.stock_txn_type AS ENUM ('in','out','adjust');
CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  txn_type public.stock_txn_type NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  ref_table TEXT,
  ref_id UUID,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stock_transactions TO authenticated;
GRANT ALL ON public.stock_transactions TO service_role;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read stock_transactions" ON public.stock_transactions FOR SELECT TO authenticated USING (true);
-- No insert/update/delete policies: writes only via SECURITY DEFINER RPCs.

-- ============ PURCHASE RECEIPTS ============
CREATE TYPE public.purchase_receipt_status AS ENUM ('draft','confirmed','cancelled');
CREATE TABLE public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.purchase_receipt_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipts TO authenticated;
GRANT ALL ON public.purchase_receipts TO service_role;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read purchase_receipts" ON public.purchase_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/warehouse manage purchase_receipts" ON public.purchase_receipts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));
CREATE TRIGGER trg_purchase_receipts_updated BEFORE UPDATE ON public.purchase_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipt_items TO authenticated;
GRANT ALL ON public.purchase_receipt_items TO service_role;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pr_items" ON public.purchase_receipt_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/warehouse manage pr_items" ON public.purchase_receipt_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));

-- ============ RPC: confirm_purchase_receipt ============
CREATE OR REPLACE FUNCTION public.confirm_purchase_receipt(_receipt_id UUID)
RETURNS public.purchase_receipts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt public.purchase_receipts;
  v_item RECORD;
  v_current_qty NUMERIC(14,3);
  v_current_cost NUMERIC(14,2);
  v_new_qty NUMERIC(14,3);
  v_new_cost NUMERIC(14,2);
  v_total NUMERIC(14,2) := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse')) THEN
    RAISE EXCEPTION 'Không có quyền xác nhận phiếu nhập';
  END IF;

  SELECT * INTO v_receipt FROM public.purchase_receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy phiếu nhập'; END IF;
  IF v_receipt.status <> 'draft' THEN RAISE EXCEPTION 'Phiếu đã ở trạng thái %', v_receipt.status; END IF;

  FOR v_item IN
    SELECT pri.*, m.avg_cost AS material_avg_cost
    FROM public.purchase_receipt_items pri
    JOIN public.materials m ON m.id = pri.material_id
    WHERE pri.receipt_id = _receipt_id
    ORDER BY pri.created_at
  LOOP
    -- update line_total
    UPDATE public.purchase_receipt_items
       SET line_total = v_item.quantity * v_item.unit_cost
     WHERE id = v_item.id;
    v_total := v_total + (v_item.quantity * v_item.unit_cost);

    -- upsert stock_balances with row lock
    INSERT INTO public.stock_balances(material_id, warehouse_id, quantity)
      VALUES (v_item.material_id, v_receipt.warehouse_id, 0)
      ON CONFLICT (material_id, warehouse_id) DO NOTHING;

    SELECT quantity INTO v_current_qty
      FROM public.stock_balances
      WHERE material_id = v_item.material_id AND warehouse_id = v_receipt.warehouse_id
      FOR UPDATE;

    UPDATE public.stock_balances
       SET quantity = v_current_qty + v_item.quantity,
           updated_at = now()
     WHERE material_id = v_item.material_id AND warehouse_id = v_receipt.warehouse_id;

    -- weighted average cost across ALL warehouses (material-level cost)
    SELECT COALESCE(SUM(sb.quantity),0) INTO v_current_qty
      FROM public.stock_balances sb WHERE sb.material_id = v_item.material_id;
    v_current_cost := v_item.material_avg_cost;
    v_new_qty := v_current_qty; -- already includes just-added qty
    IF v_new_qty > 0 THEN
      v_new_cost := ((v_current_qty - v_item.quantity) * v_current_cost + v_item.quantity * v_item.unit_cost) / v_new_qty;
    ELSE
      v_new_cost := v_item.unit_cost;
    END IF;
    UPDATE public.materials SET avg_cost = v_new_cost, updated_at = now() WHERE id = v_item.material_id;

    -- ledger
    INSERT INTO public.stock_transactions(material_id, warehouse_id, txn_type, quantity, unit_cost, ref_table, ref_id, performed_by, notes)
      VALUES (v_item.material_id, v_receipt.warehouse_id, 'in', v_item.quantity, v_item.unit_cost, 'purchase_receipts', _receipt_id, auth.uid(), 'Nhập kho từ phiếu ' || v_receipt.code);
  END LOOP;

  UPDATE public.purchase_receipts
     SET status = 'confirmed',
         confirmed_by = auth.uid(),
         confirmed_at = now(),
         total_amount = v_total,
         updated_at = now()
   WHERE id = _receipt_id
  RETURNING * INTO v_receipt;

  RETURN v_receipt;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_purchase_receipt(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_purchase_receipt(UUID) TO authenticated;
