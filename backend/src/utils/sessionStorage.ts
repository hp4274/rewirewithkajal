import { isValidSlotTime, normalizeDateInput } from './validation';

export interface QueryExecutor {
    query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

let customerSessionsSchemaInitPromise: Promise<void> | null = null;

const shouldAutoDbSchemaSync =
    process.env.AUTO_DB_SCHEMA_SYNC === 'true' ||
    (!process.env.VERCEL && process.env.AUTO_DB_SCHEMA_SYNC !== 'false');

export const ensureCustomerSessionsTable = async (executor: QueryExecutor) => {
    if (customerSessionsSchemaInitPromise) {
        return customerSessionsSchemaInitPromise;
    }

    customerSessionsSchemaInitPromise = (async () => {
        if (shouldAutoDbSchemaSync) {
            await executor.query(`
                CREATE TABLE IF NOT EXISTS customer_sessions (
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                    session_date DATE NOT NULL,
                    slot VARCHAR(5) NOT NULL,
                    presence_status VARCHAR(20) NOT NULL DEFAULT 'not_marked',
                    locked BOOLEAN NOT NULL DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT customer_sessions_presence_status_check
                        CHECK (presence_status IN ('present', 'absent', 'not_marked'))
                )
            `);

            await executor.query('CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_date ON customer_sessions(customer_id, session_date)');
            await executor.query('CREATE INDEX IF NOT EXISTS idx_customer_sessions_date_slot ON customer_sessions(session_date, slot)');
            return;
        }

        const existsResult = await executor.query("SELECT to_regclass('public.customer_sessions') AS table_name");
        if (!existsResult.rows[0]?.table_name) {
            throw new Error('Table public.customer_sessions is missing. Run migrations or set AUTO_DB_SCHEMA_SYNC=true for one-time bootstrap.');
        }
    })().catch((error) => {
        customerSessionsSchemaInitPromise = null;
        throw error;
    });

    return customerSessionsSchemaInitPromise;
};

export const normalizeSlotForSession = (slotValue: unknown): string | null => {
    if (typeof slotValue !== 'string') return null;
    const slot = slotValue.trim().slice(0, 5);
    return isValidSlotTime(slot) ? slot : null;
};

export const ensureCurrentCustomerSessionRecord = async (executor: QueryExecutor, customerId: number) => {
    const currentResult = await executor.query(
        `SELECT
            preferred_date,
            preferred_slot AS effective_slot
         FROM customers
         WHERE id = $1`,
        [customerId]
    );

    if (currentResult.rows.length === 0) return;

    const current = currentResult.rows[0];
    if (!current.preferred_date) return;

    const sessionDate = normalizeDateInput(current.preferred_date);
    const slot = normalizeSlotForSession(current.effective_slot);

    if (!sessionDate || !slot) return;

    const pendingSessionResult = await executor.query(
        `SELECT id
         FROM customer_sessions
         WHERE customer_id = $1
           AND presence_status = 'not_marked'
           AND COALESCE(locked, false) = false
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
        [customerId]
    );

    if (pendingSessionResult.rows.length > 0) {
        await executor.query(
            `UPDATE customer_sessions
             SET session_date = $2::date,
                 slot = CAST($3 AS VARCHAR(5)),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
               AND customer_id = $1`,
            [customerId, sessionDate, slot, pendingSessionResult.rows[0].id]
        );
        return;
    }

    await executor.query(
        `INSERT INTO customer_sessions (customer_id, session_date, slot, presence_status, locked, updated_at)
         SELECT $1, $2::date, CAST($3 AS VARCHAR(5)), 'not_marked', false, CURRENT_TIMESTAMP
         WHERE NOT EXISTS (
             SELECT 1 FROM customer_sessions
             WHERE customer_id = $1 AND session_date = $2::date AND slot = CAST($4 AS VARCHAR(5))
         )`,
        [customerId, sessionDate, slot, slot]
    );
};
