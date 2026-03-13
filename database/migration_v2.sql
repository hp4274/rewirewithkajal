-- migration_v2.sql
-- Adds preferred time storage for leads form submissions.

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS preferred_slot VARCHAR(5);

CREATE INDEX IF NOT EXISTS idx_leads_preferred_date_slot
    ON leads(preferred_date, preferred_slot);
