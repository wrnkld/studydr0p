
-- Fix function search path
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Tighten session UPDATE: only allow updates on sessions whose study is live (and only allow completing — sessions are anonymous so we can't tie to a user, but we limit to live studies)
DROP POLICY IF EXISTS "Anyone can update session" ON public.sessions;
CREATE POLICY "Anyone can complete session for live study"
  ON public.sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status = 'live'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status = 'live'));

-- Public bucket listing: keep bucket public (so direct file URLs work for unauthenticated participants)
-- but the SELECT policy on storage.objects allows listing via the API. Replace it with a narrower policy:
-- - Allow SELECT only when the request targets a specific object (we can't enforce this in RLS),
--   so instead we accept the warning trade-off OR move to signed URLs.
-- Safer approach: keep bucket public for direct CDN reads (which bypass RLS for public buckets),
-- and remove the broad SELECT policy on storage.objects so authed listing is restricted to owners.
DROP POLICY IF EXISTS "Public can read study assets" ON storage.objects;
-- Researchers can list/read their own study assets (objects stored under <user_id>/...)
CREATE POLICY "Researchers can read own study assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
