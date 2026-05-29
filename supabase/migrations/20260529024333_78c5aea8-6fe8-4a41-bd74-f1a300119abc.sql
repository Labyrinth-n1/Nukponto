CREATE TABLE IF NOT EXISTS public.event_articles (
  url text PRIMARY KEY,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_articles TO anon, authenticated;
GRANT ALL ON public.event_articles TO service_role;
ALTER TABLE public.event_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles public read" ON public.event_articles FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.event_factchecks (
  event_id uuid PRIMARY KEY,
  verdict text NOT NULL,
  confidence numeric NOT NULL,
  reasoning text,
  red_flags jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_factchecks TO anon, authenticated;
GRANT ALL ON public.event_factchecks TO service_role;
ALTER TABLE public.event_factchecks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factchecks public read" ON public.event_factchecks FOR SELECT TO anon, authenticated USING (true);