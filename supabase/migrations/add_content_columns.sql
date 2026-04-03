-- ═══════════════════════════════════════════════════════════
-- SchemeAtlas — Add Content & Multilingual Columns
-- Run in Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════

ALTER TABLE schemes ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS local_language TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS content_hi TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS content_local TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_central BOOLEAN DEFAULT false;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Index for state-based lookups
CREATE INDEX IF NOT EXISTS idx_schemes_state_code ON schemes(state_code);
