
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_file_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'internal';

DROP POLICY IF EXISTS "Customers can view their own record" ON public.customers;
CREATE POLICY "Customers can view their own record" ON public.customers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'customer')
    AND customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can create their own draft orders" ON public.orders;
CREATE POLICY "Customers can create their own draft orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'customer') AND status='draft'
    AND customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can update their own draft orders" ON public.orders;
CREATE POLICY "Customers can update their own draft orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'customer') AND status='draft'
    AND customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
  WITH CHECK (status='draft'
    AND customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view their order items" ON public.order_items;
CREATE POLICY "Customers can view their order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.customers c ON c.id=o.customer_id WHERE c.user_id=auth.uid()));

DROP POLICY IF EXISTS "Customers can manage draft order items" ON public.order_items;
CREATE POLICY "Customers can manage draft order items" ON public.order_items
  FOR ALL TO authenticated
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.customers c ON c.id=o.customer_id WHERE c.user_id=auth.uid() AND o.status='draft'))
  WITH CHECK (order_id IN (SELECT o.id FROM public.orders o JOIN public.customers c ON c.id=o.customer_id WHERE c.user_id=auth.uid() AND o.status='draft'));

DROP POLICY IF EXISTS "Customers can view products" ON public.products;
CREATE POLICY "Customers can view products" ON public.products
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'customer') AND is_active IS NOT FALSE);

DROP POLICY IF EXISTS "Customers can view product prices" ON public.product_prices;
CREATE POLICY "Customers can view product prices" ON public.product_prices
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'customer'));

DROP POLICY IF EXISTS "Customers manage own design files" ON storage.objects;
CREATE POLICY "Customers manage own design files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id='design-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id='design-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Staff read all design files" ON storage.objects;
CREATE POLICY "Staff read all design files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='design-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales') OR public.has_role(auth.uid(),'production')));
