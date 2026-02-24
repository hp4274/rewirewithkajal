import pool from './src/db';

async function run() {
    try {
        console.log('Dropping NOT NULL constraints...');
        await pool.query('ALTER TABLE customers ALTER COLUMN hidden_form_token DROP NOT NULL;');
        await pool.query('ALTER TABLE customers ALTER COLUMN lead_id DROP NOT NULL;');
        console.log('Successfully dropped constraints.');
    } catch (e) {
        console.error('Failed to drop column constraint:', e);
    } finally {
        await pool.end();
    }
}
run();
