GRANT SELECT, INSERT, UPDATE ON public.researchers TO authenticated;
GRANT ALL ON public.researchers TO service_role;

DROP POLICY IF EXISTS "Researchers can insert own row" ON public.researchers;
CREATE POLICY "Researchers can insert own row"
ON public.researchers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);