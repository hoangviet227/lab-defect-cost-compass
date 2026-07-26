
-- Cash accounts
CREATE TABLE public.cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'cash', -- cash | bank
  bank_name TEXT,
  bank_account TEXT,
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_accounts TO authenticated;
GRANT ALL ON public.cash_accounts TO service_role;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cash_accounts" ON public.cash_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/accountant manage cash_accounts" ON public.cash_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE TRIGGER trg_cash_accounts_updated BEFORE UPDATE ON public.cash_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Finance transactions (receipts & payments)
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  txn_type TEXT NOT NULL, -- receipt (thu) | payment (chi)
  category TEXT, -- sales, purchase, salary, other...
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cash_account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  customer_id UUID REFERENCES public.customers(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  order_id UUID REFERENCES public.orders(id),
  purchase_receipt_id UUID REFERENCES public.purchase_receipts(id),
  status TEXT NOT NULL DEFAULT 'draft', -- draft | confirmed | cancelled
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT ALL ON public.finance_transactions TO service_role;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read finance" ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/accountant manage finance" ON public.finance_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE TRIGGER trg_finance_updated BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_fin_customer ON public.finance_transactions(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_fin_supplier ON public.finance_transactions(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_fin_order ON public.finance_transactions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_fin_receipt ON public.finance_transactions(purchase_receipt_id) WHERE purchase_receipt_id IS NOT NULL;

-- Confirm finance transaction: adjust cash balance
CREATE OR REPLACE FUNCTION public.confirm_finance_transaction(_txn_id UUID)
RETURNS public.finance_transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_txn public.finance_transactions; v_delta NUMERIC(14,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant')) THEN
    RAISE EXCEPTION 'Không có quyền xác nhận phiếu thu chi';
  END IF;
  SELECT * INTO v_txn FROM public.finance_transactions WHERE id = _txn_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy phiếu'; END IF;
  IF v_txn.status <> 'draft' THEN RAISE EXCEPTION 'Phiếu đã ở trạng thái %', v_txn.status; END IF;

  v_delta := CASE WHEN v_txn.txn_type = 'receipt' THEN v_txn.amount
                  WHEN v_txn.txn_type = 'payment' THEN -v_txn.amount
                  ELSE 0 END;
  UPDATE public.cash_accounts
     SET current_balance = current_balance + v_delta, updated_at = now()
   WHERE id = v_txn.cash_account_id;

  UPDATE public.finance_transactions
     SET status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(), updated_at = now()
   WHERE id = _txn_id RETURNING * INTO v_txn;
  RETURN v_txn;
END; $$;
REVOKE ALL ON FUNCTION public.confirm_finance_transaction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_finance_transaction(UUID) TO authenticated;

-- Debt views
CREATE OR REPLACE VIEW public.v_customer_debts AS
SELECT c.id AS customer_id, c.code, c.name,
  COALESCE((SELECT SUM(total_amount) FROM public.orders o
            WHERE o.customer_id = c.id AND o.status IN ('confirmed','in_production','delivered')), 0) AS total_orders,
  COALESCE((SELECT SUM(amount) FROM public.finance_transactions f
            WHERE f.customer_id = c.id AND f.txn_type = 'receipt' AND f.status = 'confirmed'), 0) AS total_paid,
  COALESCE((SELECT SUM(total_amount) FROM public.orders o
            WHERE o.customer_id = c.id AND o.status IN ('confirmed','in_production','delivered')), 0)
  - COALESCE((SELECT SUM(amount) FROM public.finance_transactions f
            WHERE f.customer_id = c.id AND f.txn_type = 'receipt' AND f.status = 'confirmed'), 0) AS balance
FROM public.customers c;
GRANT SELECT ON public.v_customer_debts TO authenticated;

CREATE OR REPLACE VIEW public.v_supplier_debts AS
SELECT s.id AS supplier_id, s.code, s.name,
  COALESCE((SELECT SUM(total_amount) FROM public.purchase_receipts pr
            WHERE pr.supplier_id = s.id AND pr.status = 'confirmed'), 0) AS total_purchases,
  COALESCE((SELECT SUM(amount) FROM public.finance_transactions f
            WHERE f.supplier_id = s.id AND f.txn_type = 'payment' AND f.status = 'confirmed'), 0) AS total_paid,
  COALESCE((SELECT SUM(total_amount) FROM public.purchase_receipts pr
            WHERE pr.supplier_id = s.id AND pr.status = 'confirmed'), 0)
  - COALESCE((SELECT SUM(amount) FROM public.finance_transactions f
            WHERE f.supplier_id = s.id AND f.txn_type = 'payment' AND f.status = 'confirmed'), 0) AS balance
FROM public.suppliers s;
GRANT SELECT ON public.v_supplier_debts TO authenticated;
