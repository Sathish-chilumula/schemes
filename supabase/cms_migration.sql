-- ============================================================
-- SchemeAtlas CMS — SQL Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- 2. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title             text NOT NULL,
  slug              text NOT NULL UNIQUE,
  content           text DEFAULT '',
  excerpt           text DEFAULT '',
  featured_image    text DEFAULT '',
  category_id       uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at      timestamptz,
  scheduled_at      timestamptz,
  author_name       text DEFAULT 'SchemeAtlas Editorial',
  meta_title        text DEFAULT '',
  meta_description  text DEFAULT '',
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

-- 3. AUTO-UPDATE updated_at ON ARTICLE CHANGES
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_articles_updated_at ON public.articles;
CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles    ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read/write
CREATE POLICY "Auth read categories"  ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update categories" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete categories" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth read articles"    ON public.articles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert articles"  ON public.articles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update articles"  ON public.articles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete articles"  ON public.articles FOR DELETE USING (auth.role() = 'authenticated');

-- 5. SEED SOME STARTER CATEGORIES
INSERT INTO public.categories (name, slug, description) VALUES
  ('Loans',      'loans',      'Personal, home, gold and business loan guides'),
  ('Insurance',  'insurance',  'Health, life and term insurance comparisons'),
  ('Investment', 'investment', 'Mutual funds, SIP and wealth creation'),
  ('Earn Money', 'earn-money', 'Legal ways to earn money online and offline'),
  ('Schemes',    'schemes',    'Government scheme guides and breakdowns'),
  ('Tax',        'tax',        'Income tax, GST and tax saving tips')
ON CONFLICT (slug) DO NOTHING;
