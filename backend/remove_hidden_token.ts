import pool from './src/db';

async function runMigration() {
    try {
        console.log('Connecting to database executing schema shifts...');

        // 1. Drop the Hidden Form Token which is obsolete thanks to Two-Factor Customer ID matching
        try {
            await pool.query('ALTER TABLE customers DROP COLUMN hidden_form_token CASCADE;');
            console.log('Successfully dropped hidden_form_token from customers table.');
        } catch (e: any) {
            console.log('Notice: hidden_form_token might not exist.', e.message);
        }

        // 2. Adjust Leads Table for exact matching
        try {
            console.log('Splitting name into first_name and last_name on leads table...');
            await pool.query('ALTER TABLE leads RENAME COLUMN name TO first_name;');
            await pool.query('ALTER TABLE leads ADD COLUMN last_name VARCHAR(255);');
            await pool.query('ALTER TABLE leads ADD COLUMN dob DATE;');
            console.log('Successfully altered leads table schema.');
        } catch (e: any) {
            console.log('Notice: leads columns might already be altered.', e.message);
        }

        console.log('DB Schema Cleanup completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

runMigration();
