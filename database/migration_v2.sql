-- Migration script to add missing columns and tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS per_session_price INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS slot VARCHAR(100);

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
