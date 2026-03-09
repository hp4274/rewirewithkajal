-- Migration script to add missing columns and tables
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(10),
    otp_expires_at TIMESTAMP
);

ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp VARCHAR(10);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
ALTER TABLE admins DROP COLUMN IF EXISTS password;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS per_session_price INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS slot VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE customers ALTER COLUMN per_session_price SET DEFAULT 1500;
ALTER TABLE customers ALTER COLUMN total_sessions SET DEFAULT 4;

-- Backfill essential intake identity fields from leads into customers.form_data.
UPDATE customers c
SET form_data = COALESCE(c.form_data, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
        'first_name', COALESCE(NULLIF(c.form_data->>'first_name', ''), l.first_name),
        'last_name', COALESCE(NULLIF(c.form_data->>'last_name', ''), l.last_name),
        'email', COALESCE(NULLIF(c.form_data->>'email', ''), LOWER(l.email)),
        'phone', COALESCE(NULLIF(c.form_data->>'phone', ''), l.phone),
        'dob', COALESCE(NULLIF(c.form_data->>'dob', ''), TO_CHAR(l.dob, 'YYYY-MM-DD')),
        'primary_concern', COALESCE(NULLIF(c.form_data->>'primary_concern', ''), l.concern)
    )
)
FROM leads l
WHERE c.lead_id = l.id;

-- Normalize slot storage to HH:mm format used by scheduling logic.
ALTER TABLE customers
    ALTER COLUMN slot TYPE VARCHAR(5)
    USING LEFT(COALESCE(slot, ''), 5);

-- Backfill new structured columns from legacy columns / JSON payload when available.
UPDATE customers
SET occupation = COALESCE(NULLIF(occupation, ''), NULLIF(work, ''), NULLIF(form_data->>'occupation', ''), NULLIF(form_data->>'work', ''))
WHERE occupation IS NULL OR occupation = '';

UPDATE customers
SET city = COALESCE(NULLIF(city, ''), NULLIF(address, ''), NULLIF(form_data->>'city', ''))
WHERE city IS NULL OR city = '';

-- Remove legacy columns no longer used by current forms.
ALTER TABLE customers DROP COLUMN IF EXISTS age;
ALTER TABLE customers DROP COLUMN IF EXISTS hobby;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
ALTER TABLE customers DROP COLUMN IF EXISTS additional_issues;
ALTER TABLE customers DROP COLUMN IF EXISTS work;
ALTER TABLE customers DROP COLUMN IF EXISTS preferred_time;

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_number INTEGER,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_notes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    slot VARCHAR(5) NOT NULL,
    presence_status VARCHAR(20) NOT NULL DEFAULT 'not_marked',
    locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_sessions_presence_status_check
        CHECK (presence_status IN ('present', 'absent', 'not_marked'))
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_date
    ON customer_sessions(customer_id, session_date);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_date_slot
    ON customer_sessions(session_date, slot);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_sessions_customer_date_slot_unique
    ON customer_sessions(customer_id, session_date, slot);

CREATE INDEX IF NOT EXISTS idx_leads_created_at
    ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
    ON customers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_appointment_slot
    ON customers(appointment_date, slot);

CREATE INDEX IF NOT EXISTS idx_customers_form_data_gin
    ON customers USING GIN (form_data);

CREATE INDEX IF NOT EXISTS idx_customers_form_phone
    ON customers((form_data->>'phone'));

CREATE INDEX IF NOT EXISTS idx_customers_form_dob
    ON customers((form_data->>'dob'));

CREATE INDEX IF NOT EXISTS idx_payments_customer_date
    ON payments(customer_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_session_notes_customer_date
    ON session_notes(customer_id, created_at DESC);
