
-- Studies: anyone can view any study (slug-based sharing; no status gate)
DROP POLICY IF EXISTS "Public can view live or closed studies" ON public.studies;
CREATE POLICY "Public can view studies"
  ON public.studies FOR SELECT
  USING (true);

-- Cards
DROP POLICY IF EXISTS "Public can view cards of live studies" ON public.cards;
CREATE POLICY "Public can view cards"
  ON public.cards FOR SELECT
  USING (true);

-- Categories
DROP POLICY IF EXISTS "Public can view categories of live studies" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- Tree nodes
DROP POLICY IF EXISTS "Public can view tree nodes of live studies" ON public.tree_nodes;
CREATE POLICY "Public can view tree nodes"
  ON public.tree_nodes FOR SELECT
  USING (true);

-- Sessions: anyone can create / select / update a session for any study
DROP POLICY IF EXISTS "Anyone can create session for live study" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can select own session for live study" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can complete session for live study" ON public.sessions;

CREATE POLICY "Anyone can create session"
  ON public.sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = sessions.study_id));

CREATE POLICY "Anyone can select session"
  ON public.sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = sessions.study_id));

CREATE POLICY "Anyone can complete session"
  ON public.sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = sessions.study_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = sessions.study_id));

-- Responses
DROP POLICY IF EXISTS "Anyone can insert response for live study" ON public.responses;
CREATE POLICY "Anyone can insert response"
  ON public.responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = responses.study_id));
