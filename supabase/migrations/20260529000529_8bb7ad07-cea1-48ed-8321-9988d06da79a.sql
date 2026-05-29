
-- Enums
CREATE TYPE public.event_category AS ENUM ('disinformation','propaganda','satire','reliable','unverified');
CREATE TYPE public.alert_level AS ENUM ('low','moderate','high','critical');
CREATE TYPE public.stability_state AS ENUM ('stable','tension','crisis');

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  lang TEXT DEFAULT 'fr',
  country TEXT DEFAULT 'BJ',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sentiment NUMERIC,
  category public.event_category DEFAULT 'unverified',
  stability_impact INT DEFAULT 0,
  lat NUMERIC,
  lng NUMERIC,
  location_name TEXT,
  tags TEXT[] DEFAULT '{}',
  narrative_id UUID,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_published_idx ON public.events(published_at DESC);
CREATE INDEX events_category_idx ON public.events(category);

GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT TO anon, authenticated USING (true);

-- Narratives
CREATE TABLE public.narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[] DEFAULT '{}',
  event_count INT DEFAULT 0,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  suspicion_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.narratives TO anon, authenticated;
GRANT ALL ON public.narratives TO service_role;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "narratives public read" ON public.narratives FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.events ADD CONSTRAINT events_narrative_fk FOREIGN KEY (narrative_id) REFERENCES public.narratives(id) ON DELETE SET NULL;

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE SET NULL,
  level public.alert_level NOT NULL DEFAULT 'low',
  title TEXT NOT NULL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alerts_created_idx ON public.alerts(created_at DESC);
GRANT SELECT ON public.alerts TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts public read" ON public.alerts FOR SELECT TO anon, authenticated USING (true);

-- Stability snapshots
CREATE TABLE public.stability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score NUMERIC NOT NULL,
  state public.stability_state NOT NULL,
  drivers JSONB,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX stability_computed_idx ON public.stability_snapshots(computed_at DESC);
GRANT SELECT ON public.stability_snapshots TO anon, authenticated;
GRANT ALL ON public.stability_snapshots TO service_role;
ALTER TABLE public.stability_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stability public read" ON public.stability_snapshots FOR SELECT TO anon, authenticated USING (true);

-- RAG chunks (embeddings stored as jsonb float array for portability)
CREATE TABLE public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rag_chunks TO anon, authenticated;
GRANT ALL ON public.rag_chunks TO service_role;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_chunks public read" ON public.rag_chunks FOR SELECT TO anon, authenticated USING (true);
