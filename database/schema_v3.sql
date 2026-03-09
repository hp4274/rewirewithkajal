-- schema_v3.sql
-- Canonical fresh schema for the current website/backend (OTP admin, public intake, sessions, finance, blogs).

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(10),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    dob DATE,
    concern TEXT NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    preferred_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leads_status_check CHECK (status IN ('new', 'accepted', 'rejected'))
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT true,
    occupation VARCHAR(255),
    city VARCHAR(255),
    per_session_price INTEGER NOT NULL DEFAULT 1500,
    total_sessions INTEGER NOT NULL DEFAULT 4,
    appointment_date TIMESTAMP,
    slot VARCHAR(5), -- HH:mm, e.g. '10:00'
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_status_check CHECK (status IN ('pending', 'confirmed', 'deactivated', 'declined'))
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_number INTEGER,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50),
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_notes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    slot VARCHAR(5) NOT NULL,
    presence_status VARCHAR(20) NOT NULL DEFAULT 'not_marked',
    locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_sessions_presence_status_check
        CHECK (presence_status IN ('present', 'absent', 'not_marked')),
    CONSTRAINT customer_sessions_customer_date_slot_unique
        UNIQUE (customer_id, session_date, slot)
);

CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes used by admin dashboards and form-matching APIs.
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_customers_appointment_slot ON customers(appointment_date, slot);
CREATE INDEX idx_customers_form_data_gin ON customers USING GIN (form_data);
CREATE INDEX idx_customers_form_phone ON customers((form_data->>'phone'));
CREATE INDEX idx_customers_form_dob ON customers((form_data->>'dob'));
CREATE INDEX idx_payments_customer_date ON payments(customer_id, payment_date DESC);
CREATE INDEX idx_session_notes_customer_date ON session_notes(customer_id, created_at DESC);
CREATE INDEX idx_customer_sessions_customer_date ON customer_sessions(customer_id, session_date DESC);
CREATE INDEX idx_customer_sessions_date_slot ON customer_sessions(session_date, slot);
