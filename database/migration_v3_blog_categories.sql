-- migration_v3_blog_categories.sql
-- Adds blog classification fields and normalizes category values.

ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS category VARCHAR(50),
    ADD COLUMN IF NOT EXISTS excerpt TEXT,
    ADD COLUMN IF NOT EXISTS reading_time VARCHAR(50);

UPDATE blogs
SET category = CASE
    WHEN category IS NULL OR btrim(category) = '' THEN 'Mindfulness'
    WHEN lower(btrim(category)) = 'anxiety' THEN 'Anxiety'
    WHEN lower(btrim(category)) IN ('relationship', 'relationships') THEN 'Relationships'
    WHEN lower(replace(btrim(category), ' ', '-')) IN ('self-growth', 'selfgrowth') THEN 'Self-Growth'
    WHEN lower(btrim(category)) = 'trauma' THEN 'Trauma'
    WHEN lower(btrim(category)) IN ('mindfull', 'mindful', 'mindfulness') THEN 'Mindfulness'
    ELSE 'Mindfulness'
END,
excerpt = COALESCE(excerpt, ''),
reading_time = COALESCE(NULLIF(btrim(reading_time), ''), '5 min read');

ALTER TABLE blogs
    ALTER COLUMN category SET DEFAULT 'Mindfulness',
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN excerpt SET DEFAULT '',
    ALTER COLUMN reading_time SET DEFAULT '5 min read';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'blogs_category_check'
    ) THEN
        ALTER TABLE blogs
            ADD CONSTRAINT blogs_category_check
            CHECK (category IN ('Anxiety', 'Relationships', 'Self-Growth', 'Trauma', 'Mindfulness'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blogs_created_at
    ON blogs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blogs_category_active_created
    ON blogs(category, is_active, created_at DESC);
