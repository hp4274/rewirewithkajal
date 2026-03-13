-- schema_v4.sql
-- Requested minimal schema: customer data stored directly in customers table,
-- with payments/session_notes/customer_sessions/blogs kept in current shape.

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(10),
    otp_expires_at TIMESTAMP
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
    status VARCHAR(50) DEFAULT 'new', -- new, accepted, rejected
    preferred_date DATE,
    preferred_slot VARCHAR(5), -- HH:mm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    city VARCHAR(255),
    phone_number VARCHAR(50) NOT NULL,
    occupation VARCHAR(255),
    dob DATE,
    primary_concern TEXT,
    preference_visit VARCHAR(20), -- online/offline
    preferred_date DATE,
    preferred_slot VARCHAR(5), -- HH:mm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_preference_visit_check
        CHECK (preference_visit IN ('online', 'offline') OR preference_visit IS NULL)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_number INTEGER,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50), -- e.g., 'Cash', 'Online'
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_notes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    slot VARCHAR(5) NOT NULL,
    presence_status VARCHAR(20) NOT NULL DEFAULT 'not_marked',
    locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Basic indexes for the requested schema.
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_preferred_date_slot ON leads(preferred_date, preferred_slot);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone_number ON customers(phone_number);
CREATE INDEX idx_customers_preferred_date_slot ON customers(preferred_date, preferred_slot);
CREATE INDEX idx_payments_customer_date ON payments(customer_id, payment_date DESC);
CREATE INDEX idx_session_notes_customer_date ON session_notes(customer_id, created_at DESC);
CREATE INDEX idx_customer_sessions_customer_date ON customer_sessions(customer_id, session_date DESC);
CREATE INDEX idx_customer_sessions_date_slot ON customer_sessions(session_date, slot);
