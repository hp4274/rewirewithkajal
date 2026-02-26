import pool from './db';

const alterDb = async () => {
    try {
        await pool.query('ALTER TABLE customers ADD COLUMN appointment_date TIMESTAMP;');
        console.log('Successfully added appointment_date to customers table.');
        process.exit(0);
    } catch (error) {
        console.error('Error altering table:', error);
        process.exit(1);
    }
};

alterDb();
