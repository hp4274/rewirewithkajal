const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'rewire_kajal',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
      }
);

const getColumnSet = async (tableName) => {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = $1
       AND table_schema = ANY(current_schemas(false))`,
    [tableName]
  );
  return new Set(result.rows.map((row) => String(row.column_name)));
};

const makeCustomersProbeQuery = (customerColumns) => {
  const hasEmail = customerColumns.has('email');
  const hasPhone = customerColumns.has('phone_number');
  const hasFormData = customerColumns.has('form_data');

  const emailExpr = hasEmail && hasFormData
    ? "LOWER(NULLIF(TRIM(COALESCE(c.email, c.form_data->>'email', '')), ''))"
    : hasEmail
      ? "LOWER(NULLIF(TRIM(COALESCE(c.email, '')), ''))"
      : hasFormData
        ? "LOWER(NULLIF(TRIM(COALESCE(c.form_data->>'email', '')), ''))"
        : 'NULL';

  const phoneExpr = hasPhone && hasFormData
    ? "NULLIF(regexp_replace(COALESCE(c.phone_number, c.form_data->>'phone', ''), '[^0-9]', '', 'g'), '')"
    : hasPhone
      ? "NULLIF(regexp_replace(COALESCE(c.phone_number, ''), '[^0-9]', '', 'g'), '')"
      : hasFormData
        ? "NULLIF(regexp_replace(COALESCE(c.form_data->>'phone', ''), '[^0-9]', '', 'g'), '')"
        : 'NULL';

  return `EXPLAIN ANALYZE
WITH RankedCustomers AS (
  SELECT
    c.id,
    c.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY
        COALESCE(${emailExpr}, CONCAT('id:', c.id::text)),
        COALESCE(${phoneExpr}, CONCAT('id:', c.id::text))
      ORDER BY c.created_at DESC
    ) AS rn
  FROM customers c
)
SELECT id, created_at
FROM RankedCustomers
WHERE rn = 1
ORDER BY created_at DESC
LIMIT 100`;
};

const makeHistoricalQuery = (customerColumns) => {
  const hasPhone = customerColumns.has('phone_number');
  const hasDob = customerColumns.has('dob');

  if (hasPhone && hasDob) {
    return `EXPLAIN ANALYZE
SELECT id, created_at
FROM customers
WHERE phone_number = '9999999999'
  AND dob = DATE '1990-01-01'
ORDER BY created_at DESC
LIMIT 50`;
  }

  if (hasPhone) {
    return `EXPLAIN ANALYZE
SELECT id, created_at
FROM customers
WHERE phone_number = '9999999999'
ORDER BY created_at DESC
LIMIT 50`;
  }

  return `EXPLAIN ANALYZE
SELECT id, created_at
FROM customers
ORDER BY created_at DESC
LIMIT 50`;
};

const makeTurnoverQuery = (paymentColumns) => {
  if (!paymentColumns.has('payment_date') || !paymentColumns.has('amount')) {
    return null;
  }

  return `EXPLAIN ANALYZE
SELECT DATE(payment_date) AS date, SUM(amount) AS amount
FROM payments
GROUP BY DATE(payment_date)
ORDER BY DATE(payment_date) ASC`;
};

(async () => {
  try {
    const customerColumns = await getColumnSet('customers');
    const paymentColumns = await getColumnSet('payments');

    console.log(`customers columns: ${Array.from(customerColumns).join(', ')}`);
    console.log(`payments columns: ${Array.from(paymentColumns).join(', ')}`);

    const queries = [
      {
        name: 'historical_forms_lookup',
        sql: makeHistoricalQuery(customerColumns),
      },
      {
        name: 'customers_latest_dedupe_window',
        sql: makeCustomersProbeQuery(customerColumns),
      },
      {
        name: 'turnover_aggregate',
        sql: makeTurnoverQuery(paymentColumns),
      },
    ].filter((q) => Boolean(q.sql));

    for (const query of queries) {
      const result = await pool.query(query.sql);
      console.log(`\n--- ${query.name} ---`);
      for (const row of result.rows) {
        console.log(row['QUERY PLAN']);
      }
    }
  } finally {
    await pool.end().catch(() => undefined);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
