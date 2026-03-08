CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
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
    status VARCHAR(50) DEFAULT 'new', -- new, accepted
    preferred_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, deactivated, declined
    is_active BOOLEAN DEFAULT true,
    age INTEGER,
    hobby VARCHAR(255),
    address TEXT,
    additional_issues TEXT,
    work VARCHAR(255),
    preferred_time VARCHAR(100),
    per_session_price INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    appointment_date TIMESTAMP,
    slot VARCHAR(100), -- e.g., '10:00 AM - 12:00 PM'
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
