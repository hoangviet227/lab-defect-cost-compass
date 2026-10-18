CREATE TABLE public.print_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  width_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_sizes TO authenticated;
GRANT ALL ON public.print_sizes TO service_role;
ALTER TABLE public.print_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read print_sizes" ON public.print_sizes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers write print_sizes" ON public.print_sizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_print_sizes_updated BEFORE UPDATE ON public.print_sizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.product_size_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES public.print_sizes(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.customer_tiers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'direct',
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  production_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, size_id, tier_id, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_size_prices TO authenticated;
GRANT ALL ON public.product_size_prices TO service_role;
ALTER TABLE public.product_size_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read product_size_prices" ON public.product_size_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers write product_size_prices" ON public.product_size_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_psp_updated BEFORE UPDATE ON public.product_size_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.print_sizes (code, name, width_cm, height_cm, sort_order) VALUES
  ('10x15', '10×15 cm', 10, 15, 1),
  ('13x18', '13×18 cm', 13, 18, 2),
  ('15x21', '15×21 cm (A5)', 15, 21, 3),
  ('20x30', '20×30 cm (A4)', 20, 30, 4),
  ('30x40', '30×40 cm', 30, 40, 5),
  ('40x60', '40×60 cm', 40, 60, 6);