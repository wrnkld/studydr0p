ALTER TABLE public.researchers ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_researchers_stripe_customer_id ON public.researchers(stripe_customer_id);