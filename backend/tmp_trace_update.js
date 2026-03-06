require('ts-node/register');
const dbModule = require('./src/db');
const pool = dbModule.default || dbModule;
const { updateCustomerAppointment } = require('./src/controllers/customerController');

const originalConnect = pool.connect.bind(pool);
pool.connect = async () => {
  const client = await originalConnect();
  const originalQuery = client.query.bind(client);
  client.query = async (...args) => {
    const text = typeof args[0] === 'string' ? args[0] : args[0].text;
    const values = typeof args[0] === 'string' ? args[1] : args[0].values;
    const compact = String(text).replace(/\s+/g, ' ').trim();
    console.log('QUERY:', compact);
    console.log('VALUES:', JSON.stringify(values || []));
    try {
      const out = await originalQuery(...args);
      console.log('OK');
      return out;
    } catch (e) {
      console.error('FAILED_QUERY:', compact);
      console.error('FAILED_VALUES:', JSON.stringify(values || []));
      throw e;
    }
  };
  return client;
};

(async () => {
  const cust = await pool.query("SELECT id FROM customers ORDER BY id ASC LIMIT 1");
  const id = String(cust.rows[0].id);
  const req = { params: { id }, body: { appointment_date: '2026-03-20', slot: '09:00' } };
  const res = { statusCode: 200, status(code){ this.statusCode=code; return this; }, json(payload){ console.log('MOCK_STATUS', this.statusCode); console.log('MOCK_JSON', JSON.stringify(payload)); return payload; } };
  await updateCustomerAppointment(req, res);
  await pool.end();
})().catch(async (err) => {
  console.error('TRACE_SCRIPT_ERROR', err);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
