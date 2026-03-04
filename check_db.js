const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'rewirewithkajal',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkDB() {
    try {
        const res = await pool.query("SELECT id, form_data->>'first_name' as name, appointment_date, slot FROM customers WHERE appointment_date IS NOT NULL ORDER BY id DESC LIMIT 5");
        console.log("DB Rows:");
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkDB();
