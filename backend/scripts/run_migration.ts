import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
    try {
        const migrationsDir = path.join(__dirname, '../../database');
        const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((file) => /^migration_.*\.sql$/i.test(file))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        if (migrationFiles.length === 0) {
            console.log('No migration files found.');
            return;
        }

        for (const migrationFile of migrationFiles) {
            const migrationPath = path.join(migrationsDir, migrationFile);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            console.log(`Running migration: ${migrationFile}`);
            await pool.query(sql);
        }

        console.log('All migrations completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
