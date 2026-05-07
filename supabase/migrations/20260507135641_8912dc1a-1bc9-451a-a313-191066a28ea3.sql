CREATE POLICY "Anyone can select own session for live study"
ON public.sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM studies s
    WHERE s.id = sessions.study_id
    AND s.status = 'live'::study_status
  )
);