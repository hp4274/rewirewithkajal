import pool from '../src/db';

async function deleteCustomerData() {
    const client = await pool.connect();
    try {
        console.log('Starting data deletion...');

        // Count before
        const customersBefore = await client.query('SELECT COUNT(*) FROM customers');
        const leadsBefore = await client.query('SELECT COUNT(*) FROM leads');

        console.log(`Current counts: Customers: ${customersBefore.rows[0].count}, Leads: ${leadsBefore.rows[0].count}`);

        // Perform deletion
        // TRUNCATE is faster and resets identities if needed, but DELETE also works well with CASCADE
        // Since schema showed ON DELETE CASCADE on customers -> leads(id), we can delete from leads 
        // OR just truncate both. Let's use TRUNCATE for a clean reset.
        await client.query('TRUNCATE TABLE customers, leads RESTART IDENTITY CASCADE');

        console.log('Deletion successful.');

        // Count after
        const customersAfter = await client.query('SELECT COUNT(*) FROM customers');
        const leadsAfter = await client.query('SELECT COUNT(*) FROM leads');

        console.log(`New counts: Customers: ${customersAfter.rows[0].count}, Leads: ${leadsAfter.rows[0].count}`);

    } catch (err) {
        console.error('Error during deletion:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

deleteCustomerData();
