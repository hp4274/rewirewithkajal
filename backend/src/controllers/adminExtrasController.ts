import { Request, Response } from 'express';
import pool from '../db';
import { buildAppointmentTimestamp, isValidMobile10, isoDateToDdMmYyyy, normalizeDateInput } from '../utils/validation';
import { ensureCurrentCustomerSessionRecord, ensureCustomerSessionsTable, normalizeSlotForSession } from '../utils/sessionStorage';

const VALID_PRESENCE_STATUSES = new Set(['present', 'absent', 'not_marked']);

export const getCustomerPayments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM payments WHERE customer_id = $1 ORDER BY payment_date ASC', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getTurnover = async (req: Request, res: Response) => {
    try {
        const turnoverResult = await pool.query('SELECT SUM(amount) as turnover FROM payments');
        const turnover = parseInt(turnoverResult.rows[0].turnover) || 0;

        const graphDataResult = await pool.query(`
            SELECT DATE(payment_date) as date, SUM(amount) as amount 
            FROM payments 
            GROUP BY DATE(payment_date) 
            ORDER BY DATE(payment_date) ASC
        `);
        const graphData = graphDataResult.rows.map(row => ({
            date: new Date(row.date).toLocaleDateString('en-GB'), // e.g., '25/02/2026'
            amount: parseInt(row.amount) || 0
        }));

        const sessionInsightsResult = await pool.query(`
            SELECT payment_type as name, COUNT(*) as count, SUM(amount) as total_amount 
            FROM payments 
            GROUP BY payment_type
        `);
        const sessionInsights = sessionInsightsResult.rows.map(row => ({
            name: row.name || 'Unknown',
            value: parseInt(row.total_amount) || 0,
            count: parseInt(row.count) || 0
        }));

        res.json({ turnover, graphData, sessionInsights });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const addPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { session_number, amount, payment_type } = req.body;

        const result = await pool.query(
            'INSERT INTO payments (customer_id, session_number, amount, payment_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, session_number, amount, payment_type]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateCustomerSettings = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active, per_session_price, total_sessions, status } = req.body;

        const result = await pool.query(
            'UPDATE customers SET is_active = $1, per_session_price = $2, total_sessions = $3, status = $4 WHERE id = $5 RETURNING *',
            [is_active, per_session_price, total_sessions, status || 'confirmed', id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomerNotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Get notes newest first
        const result = await pool.query('SELECT * FROM session_notes WHERE customer_id = $1 ORDER BY created_at DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const addCustomerNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { note_text } = req.body;

        const result = await pool.query(
            'INSERT INTO session_notes (customer_id, note_text) VALUES ($1, $2) RETURNING *',
            [id, note_text]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomerSessions = async (req: Request, res: Response) => {
    try {
        const customerId = Number(req.params.id);
        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({ message: 'Invalid customer id.' });
        }

        await ensureCustomerSessionsTable(pool);
        await ensureCurrentCustomerSessionRecord(pool, customerId);

        const result = await pool.query(
            `SELECT
                id,
                customer_id,
                TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date,
                slot,
                presence_status,
                locked,
                created_at,
                updated_at,
                CASE
                    WHEN slot ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' THEN (session_date::timestamp + slot::time) < NOW()
                    ELSE false
                END AS is_past
             FROM customer_sessions
             WHERE customer_id = $1
             ORDER BY session_date DESC, slot DESC`,
            [customerId]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateSessionPresence = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const customerId = Number(req.params.id);
        const sessionId = Number(req.params.sessionId);
        const rawStatus = typeof req.body?.presence_status === 'string'
            ? req.body.presence_status.trim().toLowerCase()
            : '';

        if (!Number.isInteger(customerId) || customerId <= 0 || !Number.isInteger(sessionId) || sessionId <= 0) {
            return res.status(400).json({ message: 'Invalid customer or session id.' });
        }

        if (!VALID_PRESENCE_STATUSES.has(rawStatus)) {
            return res.status(400).json({ message: 'Presence status must be Present, Absent, or Not Marked.' });
        }

        await client.query('BEGIN');
        await ensureCustomerSessionsTable(client);
        await ensureCurrentCustomerSessionRecord(client, customerId);

        const sessionResult = await client.query(
            `SELECT id, customer_id, session_date, slot, presence_status, locked
             FROM customer_sessions
             WHERE id = $1 AND customer_id = $2
             FOR UPDATE`,
            [sessionId, customerId]
        );

        if (sessionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Session not found for this customer.' });
        }

        const currentSession = sessionResult.rows[0];

        const customerSettingsResult = await client.query(
            `SELECT COALESCE(total_sessions, 0)::int AS total_sessions
             FROM customers
             WHERE id = $1
             FOR UPDATE`,
            [customerId]
        );
        const configuredTotalSessions = Number(customerSettingsResult.rows[0]?.total_sessions || 0);

        if ((currentSession.locked || currentSession.presence_status === 'present') && rawStatus !== 'present') {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Present sessions are locked and cannot be changed.' });
        }

        const updatedSessionResult = await client.query(
            `UPDATE customer_sessions
             SET presence_status = CAST($1 AS VARCHAR(20)),
                 locked = CASE WHEN CAST($2 AS VARCHAR(20)) = 'present'::VARCHAR THEN true ELSE false END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [rawStatus, rawStatus, sessionId]
        );

        const updatedSession = updatedSessionResult.rows[0];

        if (rawStatus === 'present') {
            const normalizedCurrentDate = normalizeDateInput(currentSession.session_date);
            const normalizedCurrentSlot = normalizeSlotForSession(currentSession.slot);

            // Keep attendance update successful even if old session rows contain malformed date/slot values.
            if (!normalizedCurrentDate || !normalizedCurrentSlot) {
                await client.query('COMMIT');
                return res.status(200).json({
                    message: 'Session marked present, but auto-scheduling was skipped due to invalid session date/slot format.',
                    session: updatedSession,
                    nextSessionCreated: false,
                    conflict: false
                });
            }

            if (configuredTotalSessions > 0) {
                const totalSessionCountResult = await client.query(
                    `SELECT COUNT(*)::int AS session_count
                     FROM customer_sessions
                     WHERE customer_id = $1`,
                    [customerId]
                );
                const existingSessionCount = Number(totalSessionCountResult.rows[0]?.session_count || 0);

                if (existingSessionCount >= configuredTotalSessions) {
                    await client.query(
                        `UPDATE customers
                         SET appointment_date = CASE
                                WHEN DATE(appointment_date) = $1::date
                                     AND COALESCE(NULLIF(slot, '')::text, TO_CHAR(appointment_date, 'HH24:MI')) = $2::text
                                THEN NULL
                                ELSE appointment_date
                            END,
                            slot = CASE
                                WHEN DATE(appointment_date) = $1::date
                                     AND COALESCE(NULLIF(slot, '')::text, TO_CHAR(appointment_date, 'HH24:MI')) = $2::text
                                THEN NULL
                                ELSE slot
                            END
                         WHERE id = $3`,
                        [normalizedCurrentDate, normalizedCurrentSlot, customerId]
                    );

                    await client.query('COMMIT');
                    return res.status(200).json({
                        message: `Session marked present. Total session limit (${configuredTotalSessions}) reached, so no new session was scheduled.`,
                        session: updatedSession,
                        nextSessionCreated: false,
                        conflict: false,
                        limitReached: true
                    });
                }
            }

            const nextDateResult = await client.query(
                `SELECT TO_CHAR(($1::date + INTERVAL '7 day')::date, 'YYYY-MM-DD') AS next_date`,
                [normalizedCurrentDate]
            );
            const nextDate = nextDateResult.rows[0].next_date as string;

            const conflictResult = await client.query(
                `SELECT cs.id,
                        cs.customer_id,
                        TRIM(CONCAT(COALESCE(l.first_name, c.form_data->>'first_name', 'Another'), ' ', COALESCE(l.last_name, c.form_data->>'last_name', 'Customer'))) AS customer_name
                 FROM customer_sessions cs
                 LEFT JOIN customers c ON cs.customer_id = c.id
                 LEFT JOIN leads l ON c.lead_id = l.id
                 WHERE cs.session_date = $1::date
                   AND cs.slot = $2
                   AND cs.customer_id != $3
                 LIMIT 1`,
                                [nextDate, normalizedCurrentSlot, customerId]
            );

            const conflictAppointmentResult = await client.query(
                `SELECT c.id,
                        TRIM(CONCAT(COALESCE(l.first_name, c.form_data->>'first_name', 'Another'), ' ', COALESCE(l.last_name, c.form_data->>'last_name', 'Customer'))) AS customer_name
                 FROM customers c
                 LEFT JOIN leads l ON c.lead_id = l.id
                                 WHERE c.id != $3
                   AND DATE(c.appointment_date) = $1::date
                                     AND COALESCE(NULLIF(c.slot, '')::text, TO_CHAR(c.appointment_date, 'HH24:MI')) = $2::text
                 LIMIT 1`,
                                                                [nextDate, normalizedCurrentSlot, customerId]
            );

            if (conflictResult.rows.length > 0 || conflictAppointmentResult.rows.length > 0) {
                const conflictName = conflictResult.rows[0]?.customer_name || conflictAppointmentResult.rows[0]?.customer_name || 'another customer';
                await client.query('COMMIT');
                return res.status(200).json({
                    message: `Session marked present, but auto-scheduling was blocked because ${conflictName} already has this slot on ${nextDate}.`,
                    session: updatedSession,
                    nextSessionCreated: false,
                    conflict: true
                });
            }

            await client.query(
                `INSERT INTO customer_sessions (customer_id, session_date, slot, presence_status, locked, updated_at)
                 SELECT $1, $2::date, CAST($3 AS VARCHAR(5)), 'not_marked', false, CURRENT_TIMESTAMP
                 WHERE NOT EXISTS (
                     SELECT 1 FROM customer_sessions
                     WHERE customer_id = $1 AND session_date = $2::date AND slot = CAST($4 AS VARCHAR(5))
                 )`,
                [customerId, nextDate, normalizedCurrentSlot, normalizedCurrentSlot]
            );

            const nextSessionResult = await client.query(
                `SELECT * FROM customer_sessions
                 WHERE customer_id = $1
                   AND session_date = $2::date
                   AND slot = $3
                 ORDER BY id DESC
                 LIMIT 1`,
                [customerId, nextDate, normalizedCurrentSlot]
            );

            const nextAppointmentTimestamp = buildAppointmentTimestamp(nextDate, normalizedCurrentSlot);
            await client.query(
                'UPDATE customers SET appointment_date = $1, slot = $2 WHERE id = $3',
                [nextAppointmentTimestamp, normalizedCurrentSlot, customerId]
            );

            await client.query('COMMIT');
            return res.status(200).json({
                message: 'Session marked present and next session auto-scheduled after 7 days.',
                session: updatedSession,
                nextSession: nextSessionResult.rows[0] || null,
                nextSessionCreated: true,
                conflict: false
            });
        }

        await client.query('COMMIT');
        return res.status(200).json({
            message: 'Session presence updated successfully.',
            session: updatedSession,
            nextSessionCreated: false,
            conflict: false
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Ignore rollback failure and return original error.
        }
        res.status(500).json({ message: 'Server Error', error });
    } finally {
        client.release();
    }
};

export const getHistoricalForms = async (req: Request, res: Response) => {
    try {
        const { phone, dob } = req.query;
        if (!phone || !dob) return res.status(400).json({ message: 'Phone number and DOB required for secure matching' });

        const normalizedPhone = String(phone).trim();
        const normalizedDob = normalizeDateInput(String(dob));

        if (!isValidMobile10(normalizedPhone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
        }

        if (!normalizedDob) {
            return res.status(400).json({ message: 'DOB must be in DD-MM-YYYY format.' });
        }

        const dobCandidates = [String(dob).trim(), normalizedDob, isoDateToDdMmYyyy(normalizedDob)].filter(
            (value, index, arr) => value && arr.indexOf(value) === index
        );

        // Using jsonb extraction operator ->> to match phone and dob inside form_data
        const query = `
            SELECT * FROM customers 
            WHERE form_data->>'phone' = $1
              AND (form_data->>'dob') = ANY($2::text[])
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [normalizedPhone, dobCandidates]);

        const validForms = result.rows.filter(form =>
            form.form_data && Array.isArray(form.form_data.q1) && Array.isArray(form.form_data.q2)
        );

        const uniqueForms = validForms.filter((form, index, self) =>
            index === self.findIndex((t) => JSON.stringify(t.form_data) === JSON.stringify(form.form_data))
        );

        res.json(uniqueForms);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getHistoricalFormById = async (req: Request, res: Response) => {
    try {
        const { formId } = req.params;
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [formId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Form not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
