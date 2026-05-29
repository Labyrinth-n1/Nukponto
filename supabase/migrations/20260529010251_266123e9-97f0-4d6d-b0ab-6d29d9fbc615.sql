
-- Extension de la table events pour le format GDELT du repo
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS actor1_name text,
  ADD COLUMN IF NOT EXISTS actor2_name text,
  ADD COLUMN IF NOT EXISTS actor1_country text,
  ADD COLUMN IF NOT EXISTS actor2_country text,
  ADD COLUMN IF NOT EXISTS is_root_event boolean,
  ADD COLUMN IF NOT EXISTS event_code text,
  ADD COLUMN IF NOT EXISTS event_root_code text,
  ADD COLUMN IF NOT EXISTS goldstein_scale numeric,
  ADD COLUMN IF NOT EXISTS avg_tone numeric,
  ADD COLUMN IF NOT EXISTS num_mentions integer,
  ADD COLUMN IF NOT EXISTS num_sources integer,
  ADD COLUMN IF NOT EXISTS num_articles integer,
  ADD COLUMN IF NOT EXISTS action_geo_country text,
  ADD COLUMN IF NOT EXISTS action_geo_fullname text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS cluster integer,
  ADD COLUMN IF NOT EXISTS context_type text,
  ADD COLUMN IF NOT EXISTS pca1 numeric,
  ADD COLUMN IF NOT EXISTS pca2 numeric;

CREATE INDEX IF NOT EXISTS idx_events_published_at ON public.events(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_cluster ON public.events(cluster);

-- Table des scores journaliers de stabilité (issus de daily_score.csv)
CREATE TABLE IF NOT EXISTS public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  goldstein_scale numeric,
  stability_score numeric,
  score numeric NOT NULL,
  status text NOT NULL,
  month text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_scores TO anon, authenticated;
GRANT ALL ON public.daily_scores TO service_role;

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_scores public read" ON public.daily_scores
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_scores_date ON public.daily_scores(date DESC);

-- Table des prévisions de stabilité (issues de stability_forecast.csv)
CREATE TABLE IF NOT EXISTS public.stability_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  predicted_stability_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stability_forecasts TO anon, authenticated;
GRANT ALL ON public.stability_forecasts TO service_role;

ALTER TABLE public.stability_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stability_forecasts public read" ON public.stability_forecasts
  FOR SELECT TO anon, authenticated USING (true);
