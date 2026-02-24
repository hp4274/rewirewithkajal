import pool from './src/db';

async function runMigration() {
    try {
        console.log('Connecting to the database...');

        // Make lead_id nullable
        await pool.query('ALTER TABLE customers ALTER COLUMN lead_id DROP NOT NULL;');
        console.log('Successfully altered lead_id constraint.');

        // Make hidden_form_token nullable
        await pool.query('ALTER TABLE customers ALTER COLUMN hidden_form_token DROP NOT NULL;');
        console.log('Successfully altered hidden_form_token constraint.');

        // Drop the unique constraint on hidden_form_token if it exists, since nulls might cause issues depending on PG version/setup
        try {
            await pool.query('ALTER TABLE customers DROP CONSTRAINT customers_hidden_form_token_key;');
            console.log('Successfully dropped unique constraint on hidden_form_token.');
        } catch (e: any) {
            console.log('Constraint might not exist or already dropped.', e.message);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

runMigration();
