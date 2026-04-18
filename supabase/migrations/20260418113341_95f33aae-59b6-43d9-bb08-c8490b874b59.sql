
CREATE TYPE public.study_type AS ENUM ('card_sort', 'survey', 'first_click', 'tree_test', 'five_second');
CREATE TYPE public.study_status AS ENUM ('draft', 'live', 'closed');

CREATE TABLE public.researchers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.researchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Researchers can view own row" ON public.researchers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Researchers can update own row" ON public.researchers FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_researcher()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.researchers (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_researcher
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_researcher();

CREATE TABLE public.studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type public.study_type NOT NULL,
  status public.study_status NOT NULL DEFAULT 'draft',
  slug TEXT UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_studies_researcher ON public.studies(researcher_id);
CREATE INDEX idx_studies_slug ON public.studies(slug);
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Researchers view own studies" ON public.studies FOR SELECT USING (auth.uid() = researcher_id);
CREATE POLICY "Researchers insert own studies" ON public.studies FOR INSERT WITH CHECK (auth.uid() = researcher_id);
CREATE POLICY "Researchers update own studies" ON public.studies FOR UPDATE USING (auth.uid() = researcher_id);
CREATE POLICY "Researchers delete own studies" ON public.studies FOR DELETE USING (auth.uid() = researcher_id);
CREATE POLICY "Public can view live or closed studies" ON public.studies FOR SELECT USING (status IN ('live', 'closed'));

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_sessions_study ON public.sessions(study_id);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create session for live study" ON public.sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status = 'live'));
CREATE POLICY "Anyone can update session" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Researchers view own study sessions" ON public.sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()));

CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_responses_study ON public.responses(study_id);
CREATE INDEX idx_responses_session ON public.responses(session_id);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert response for live study" ON public.responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status = 'live'));
CREATE POLICY "Researchers view own study responses" ON public.responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()));

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_cards_study ON public.cards(study_id);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Researchers manage own cards" ON public.cards FOR ALL
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()));
CREATE POLICY "Public can view cards of live studies" ON public.cards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status IN ('live','closed')));

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_categories_study ON public.categories(study_id);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Researchers manage own categories" ON public.categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()));
CREATE POLICY "Public can view categories of live studies" ON public.categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status IN ('live','closed')));

CREATE TABLE public.tree_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tree_nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_tree_nodes_study ON public.tree_nodes(study_id);
CREATE INDEX idx_tree_nodes_parent ON public.tree_nodes(parent_id);
ALTER TABLE public.tree_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Researchers manage own tree nodes" ON public.tree_nodes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.researcher_id = auth.uid()));
CREATE POLICY "Public can view tree nodes of live studies" ON public.tree_nodes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.studies s WHERE s.id = study_id AND s.status IN ('live','closed')));

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER studies_set_updated_at
  BEFORE UPDATE ON public.studies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('study-assets', 'study-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read study assets" ON storage.objects FOR SELECT USING (bucket_id = 'study-assets');
CREATE POLICY "Authed can upload study assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authed can update study assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'study-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authed can delete study assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'study-assets' AND auth.uid() IS NOT NULL);
