import pool from '../src/db';

const deleteAllData = async () => {
    try {
        console.log('Connecting to DB and deleting data...');

        // Using CASCADE on customer deletion will also delete payments, session_notes
        // Using CASCADE on leads deletion will also delete customers (and their related data)
        await pool.query('DELETE FROM leads;');

        console.log('Successfully deleted all leads, customers, payments, and session notes.');
        process.exit(0);
    } catch (err) {
        console.error('Error deleting data:', err);
        process.exit(1);
    }
};

deleteAllData();
