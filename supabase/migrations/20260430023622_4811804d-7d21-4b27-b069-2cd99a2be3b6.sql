
CREATE POLICY "Researchers can insert sessions for own studies"
ON public.sessions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.studies s
  WHERE s.id = sessions.study_id AND s.researcher_id = auth.uid()
));

CREATE POLICY "Researchers can update sessions for own studies"
ON public.sessions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.studies s
  WHERE s.id = sessions.study_id AND s.researcher_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.studies s
  WHERE s.id = sessions.study_id AND s.researcher_id = auth.uid()
));

CREATE POLICY "Researchers can insert responses for own studies"
ON public.responses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.studies s
  WHERE s.id = responses.study_id AND s.researcher_id = auth.uid()
));
