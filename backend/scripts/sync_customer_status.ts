import pool from '../src/db';

async function syncData() {
    try {
        console.log('Starting database data sync...');

        // 1. Where is_active is true and status is pending, set status to confirmed
        const confirmedRes = await pool.query(`
            UPDATE customers 
            SET status = 'confirmed' 
            WHERE is_active = true AND status = 'pending'
            RETURNING id
        `);
        console.log(`Updated ${confirmedRes.rowCount} records to 'confirmed' status.`);

        // 2. Where is_active is false and status is confirmed/pending, set status to deactivated
        const deactivatedRes = await pool.query(`
            UPDATE customers 
            SET status = 'deactivated' 
            WHERE is_active = false AND (status = 'confirmed' OR status = 'pending')
            RETURNING id
        `);
        console.log(`Updated ${deactivatedRes.rowCount} records to 'deactivated' status.`);

        console.log('Data sync completed successfully.');
    } catch (error) {
        console.error('Error during data sync:', error);
    } finally {
        await pool.end();
    }
}

syncData();
