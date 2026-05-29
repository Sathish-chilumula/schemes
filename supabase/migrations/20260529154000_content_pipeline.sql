-- Add new columns for tracking word counts, rewrite timestamps, and content type
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS word_count_en INTEGER DEFAULT 0;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS word_count_hi INTEGER DEFAULT 0;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS word_count_local INTEGER DEFAULT 0;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS rewritten_at TIMESTAMPTZ;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'scheme';

-- Create table for tracking pipeline jobs
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name VARCHAR(100),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  items_processed INTEGER,
  items_succeeded INTEGER,
  items_failed INTEGER,
  avg_word_count_before INTEGER,
  avg_word_count_after INTEGER,
  details JSONB
);

-- Function to automatically calculate word count
CREATE OR REPLACE FUNCTION update_word_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word_count_en based on content_en
  IF NEW.content_en IS NOT NULL THEN
    NEW.word_count_en = array_length(regexp_split_to_array(trim(NEW.content_en), '\s+'), 1);
  ELSE
    NEW.word_count_en = 0;
  END IF;

  -- Calculate word_count_hi based on content_hi
  IF NEW.content_hi IS NOT NULL THEN
    NEW.word_count_hi = array_length(regexp_split_to_array(trim(NEW.content_hi), '\s+'), 1);
  ELSE
    NEW.word_count_hi = 0;
  END IF;

  -- Calculate word_count_local based on content_local
  IF NEW.content_local IS NOT NULL THEN
    NEW.word_count_local = array_length(regexp_split_to_array(trim(NEW.content_local), '\s+'), 1);
  ELSE
    NEW.word_count_local = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function before insert or update
DROP TRIGGER IF EXISTS schemes_word_count_trigger ON schemes;
CREATE TRIGGER schemes_word_count_trigger
BEFORE INSERT OR UPDATE OF content_en, content_hi, content_local ON schemes
FOR EACH ROW EXECUTE FUNCTION update_word_counts();
