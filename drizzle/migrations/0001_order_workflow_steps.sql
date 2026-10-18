ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'design';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'printing';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'packing';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_size_id UUID REFERENCES public.print_sizes(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'direct';
COMMENT ON COLUMN public.orders.channel IS 'Kênh bán: direct, facebook, tiktok, shopee, lazada';

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS print_size_id UUID REFERENCES public.print_sizes(id);