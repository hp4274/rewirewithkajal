import pool from './src/db';

async function runMigration() {
    try {
        console.log('Connecting to the database...');

        // 1. Add fields to customers table
        console.log('Adding new columns to customers table...');
        try {
            await pool.query('ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;');
            await pool.query('ALTER TABLE customers ADD COLUMN per_session_price INTEGER DEFAULT 1500;');
            await pool.query('ALTER TABLE customers ADD COLUMN total_sessions INTEGER DEFAULT 4;');
            // Admin-scheduled appointment date+time (slot). Keep as TIMESTAMP so time is not lost.
            await pool.query('ALTER TABLE customers ADD COLUMN appointment_date TIMESTAMP;');
        } catch (e: any) {
            console.log('Warning: some columns may already exist.', e.message);
        }

        // Ensure appointment_date is TIMESTAMP even if it was created as DATE previously.
        try {
            await pool.query(`
                ALTER TABLE customers
                ALTER COLUMN appointment_date
                TYPE TIMESTAMP
                USING appointment_date::timestamp;
            `);
        } catch (e: any) {
            console.log('Warning: could not alter appointment_date type (maybe already TIMESTAMP).', e.message);
        }

        // 2. Create Payments Table
        console.log('Creating payments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                session_number INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                payment_type VARCHAR(50) NOT NULL, -- 'cash' or 'online'
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create Session Notes Table
        console.log('Creating session_notes table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS session_notes (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                note_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Admin Schema Migration completed successfully.');
    } catch (error) {
        console.error('Error during admin schema migration:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

runMigration();
