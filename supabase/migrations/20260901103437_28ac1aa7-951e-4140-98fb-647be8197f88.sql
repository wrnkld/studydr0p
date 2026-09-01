DROP POLICY IF EXISTS "Anyone can insert response" ON public.responses;
DROP POLICY IF EXISTS "Researchers can insert responses for own studies" ON public.responses;
CREATE POLICY "Anyone can insert response" ON public.responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create session" ON public.sessions;
DROP POLICY IF EXISTS "Researchers can insert sessions for own studies" ON public.sessions;
CREATE POLICY "Anyone can create session" ON public.sessions FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON public.responses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
GRANT ALL ON public.sessions TO service_role;