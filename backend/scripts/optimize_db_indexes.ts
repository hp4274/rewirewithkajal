import dotenv from 'dotenv';
import pool from '../src/db';

dotenv.config();

type ColumnCheck = Record<string, boolean>;

const hasColumns = async (table: string, columns: string[]): Promise<ColumnCheck> => {
    const result = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = $1
           AND table_schema = ANY(current_schemas(false))`,
        [table]
    );
    const existing = new Set(result.rows.map((row: any) => String(row.column_name)));
    const checks: ColumnCheck = {};
    for (const column of columns) {
        checks[column] = existing.has(column);
    }
    return checks;
};

const createIndexSafely = async (concurrentSql: string, fallbackSql: string) => {
    try {
        await pool.query(concurrentSql);
    } catch (error: any) {
        const message = String(error?.message || '');
        const code = String(error?.code || '');
        const cannotConcurrent =
            code === '0A000' ||
            code === '25001' ||
            message.includes('CONCURRENTLY');

        if (!cannotConcurrent) {
            throw error;
        }

        await pool.query(fallbackSql);
    }
};

const run = async () => {
    console.log('[db-optimize] starting index optimization');

    const customers = await hasColumns('customers', [
        'email',
        'phone_number',
        'form_data',
        'preferred_date',
        'preferred_slot',
        'created_at',
    ]);
    const leads = await hasColumns('leads', ['created_at']);
    const blogs = await hasColumns('blogs', ['created_at']);

    if (leads.created_at) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)'
        );
    }

    if (blogs.created_at) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)'
        );
    }

    if (customers.created_at) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC)'
        );
    }

    if (customers.email) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email_lower ON customers (LOWER(email))',
            'CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers (LOWER(email))'
        );
    }

    if (customers.phone_number) {
        await createIndexSafely(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone_digits ON customers ((regexp_replace(phone_number, '[^0-9]', '', 'g')))",
            "CREATE INDEX IF NOT EXISTS idx_customers_phone_digits ON customers ((regexp_replace(phone_number, '[^0-9]', '', 'g')))"
        );
    }

    if (customers.form_data) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_form_data_gin ON customers USING GIN (form_data)',
            'CREATE INDEX IF NOT EXISTS idx_customers_form_data_gin ON customers USING GIN (form_data)'
        );

        await createIndexSafely(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_form_email_lower ON customers (LOWER(form_data->>'email'))",
            "CREATE INDEX IF NOT EXISTS idx_customers_form_email_lower ON customers (LOWER(form_data->>'email'))"
        );

        await createIndexSafely(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_form_phone_digits ON customers ((regexp_replace(form_data->>'phone', '[^0-9]', '', 'g')))",
            "CREATE INDEX IF NOT EXISTS idx_customers_form_phone_digits ON customers ((regexp_replace(form_data->>'phone', '[^0-9]', '', 'g')))"
        );
    }

    if (customers.preferred_date && customers.preferred_slot) {
        await createIndexSafely(
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_preferred_date_slot ON customers(preferred_date, preferred_slot)',
            'CREATE INDEX IF NOT EXISTS idx_customers_preferred_date_slot ON customers(preferred_date, preferred_slot)'
        );
    }

    console.log('[db-optimize] index optimization completed');
};

run()
    .catch((error) => {
        console.error('[db-optimize] failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end().catch(() => undefined);
    });
