import { Request, Response } from 'express';
import pool from '../db';
import { sendEmail } from '../utils/mailer';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import {
    isDobNotFuture,
    isTodayOrFutureDate,
    isValidEmail,
    isValidMobile10,
    normalizeDateInput
} from '../utils/validation';

let leadCustomerColumnsPromise: Promise<Set<string>> | null = null;
let leadColumnsPromise: Promise<Set<string>> | null = null;

const getCustomerColumns = async (): Promise<Set<string>> => {
    if (!leadCustomerColumnsPromise) {
        leadCustomerColumnsPromise = (async () => {
            const result = await pool.query(
                `SELECT column_name
                 FROM information_schema.columns
                 WHERE table_name = 'customers'
                   AND table_schema = ANY(current_schemas(false))`
            );
            return new Set(result.rows.map((row: any) => String(row.column_name)));
        })().catch((error) => {
            leadCustomerColumnsPromise = null;
            throw error;
        });
    }

    return leadCustomerColumnsPromise;
};

const getLeadColumns = async (): Promise<Set<string>> => {
    if (!leadColumnsPromise) {
        leadColumnsPromise = (async () => {
            const result = await pool.query(
                `SELECT column_name
                 FROM information_schema.columns
                 WHERE table_name = 'leads'
                   AND table_schema = ANY(current_schemas(false))`
            );
            return new Set(result.rows.map((row: any) => String(row.column_name)));
        })().catch((error) => {
            leadColumnsPromise = null;
            throw error;
        });
    }

    return leadColumnsPromise;
};

const buildEmailExpr = (alias: string, hasEmail: boolean, hasFormData: boolean): string => {
    const sources: string[] = [];
    if (hasEmail) sources.push(`${alias}.email`);
    if (hasFormData) sources.push(`${alias}.form_data->>'email'`);
    if (sources.length === 0) return 'NULL';
    return `LOWER(NULLIF(TRIM(COALESCE(${sources.join(', ')}, '')), ''))`;
};

const buildPhoneExpr = (alias: string, hasPhone: boolean, hasFormData: boolean): string => {
    const sources: string[] = [];
    if (hasPhone) sources.push(`${alias}.phone_number`);
    if (hasFormData) sources.push(`${alias}.form_data->>'phone'`);
    if (sources.length === 0) return 'NULL';
    return `NULLIF(regexp_replace(COALESCE(${sources.join(', ')}, ''), '[^0-9]', '', 'g'), '')`;
};

export const createLead = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, dob, email, phone, concern, message, preferred_date } = req.body;

        const normalizedDob = normalizeDateInput(dob);
        const normalizedPreferredDate = preferred_date ? normalizeDateInput(preferred_date) : null;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

        if (!normalizedDob) {
            return res.status(400).json({ message: 'DOB must be in DD-MM-YYYY format.' });
        }

        if (!isDobNotFuture(normalizedDob)) {
            return res.status(400).json({ message: 'DOB cannot be in the future.' });
        }

        if (preferred_date && !normalizedPreferredDate) {
            return res.status(400).json({ message: 'Preferred date must be in DD-MM-YYYY format.' });
        }

        if (normalizedPreferredDate && !isTodayOrFutureDate(normalizedPreferredDate)) {
            return res.status(400).json({ message: 'Preferred date cannot be in the past.' });
        }

        if (!isValidMobile10(normalizedPhone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        const result = await pool.query(
            'INSERT INTO leads (first_name, last_name, dob, email, phone, concern, message, preferred_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [first_name, last_name, normalizedDob, normalizedEmail, normalizedPhone, concern, message, normalizedPreferredDate]
        );

        // Send Welcome/Thank you Email
        try {
            await sendEmail({
                to: email,
                subject: 'Thank you for reaching out to Rewire With Kajal',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #FF8F4B;">Hello ${first_name},</h2>
                        <p>Thank you for requesting a consultation with <strong>Rewire With Kajal</strong>.</p>
                        <p>We have successfully received your request regarding <em>${concern}</em>. Our team is reviewing your details and we will get back to you shortly with next steps.</p>
                        <br/>
                        <p>Warmly,</p>
                        <p><strong>Kajal & Team</strong></p>
                    </div>
                `
            });
        } catch (mailError) {
            console.error('Failed to send thank you email on lead creation:', mailError);
            // Don't fail the lead creation if email fails
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getLeads = async (req: Request, res: Response) => {
    try {
        const leadColumns = await getLeadColumns();
        const { page, limit, offset } = parsePagination(req.query.page, req.query.limit, {
            defaultLimit: 50,
            maxLimit: 200,
        });

        const selectColumns: string[] = [];
        const optionalTextColumns = ['id', 'first_name', 'last_name', 'dob', 'email', 'phone', 'concern', 'message'];

        for (const column of optionalTextColumns) {
            if (leadColumns.has(column)) {
                selectColumns.push(`l.${column}`);
            }
        }

        selectColumns.push(
            leadColumns.has('preferred_date') ? 'l.preferred_date' : 'NULL::date AS preferred_date',
            leadColumns.has('status') ? 'l.status' : "'new'::text AS status",
            leadColumns.has('created_at') ? 'l.created_at' : 'NULL::timestamp AS created_at'
        );

        if (selectColumns.length === 0) {
            return res.status(500).json({ message: 'Leads schema is missing required columns.' });
        }

        const orderByClause = leadColumns.has('created_at')
            ? 'l.created_at DESC'
            : leadColumns.has('id')
                ? 'l.id DESC'
                : '1';

        const [result, countResult] = await Promise.all([
            pool.query(
                `SELECT ${selectColumns.join(', ')}
                 FROM leads l
                 ORDER BY ${orderByClause}
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            pool.query('SELECT COUNT(*)::int AS total FROM leads'),
        ]);

        const leads = result.rows.map(row => ({
            ...row,
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim()
        }));

        res.json({
            items: leads,
            meta: buildPaginationMeta(Number(countResult.rows[0]?.total || 0), page, limit),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const acceptLead = async (req: Request, res: Response) => {
    try {
        const columns = await getCustomerColumns();
        const leadColumns = await getLeadColumns();
        const hasEmail = columns.has('email');
        const hasPhone = columns.has('phone_number');
        const hasFormData = columns.has('form_data');
        const hasLeadStatus = leadColumns.has('status');

        const { id } = req.params;
        const client = await pool.connect();
        let lead: any = null;
        let customerRow: any = null;

        try {
            await client.query('BEGIN');

            const leadResult = hasLeadStatus
                ? await client.query(
                    'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
                    ['accepted', id]
                )
                : await client.query(
                    'SELECT * FROM leads WHERE id = $1 LIMIT 1',
                    [id]
                );

            if (leadResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Lead not found' });
            }

            lead = leadResult.rows[0];

            const normalizedEmail = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';
            const normalizedPhone = typeof lead.phone === 'string' ? lead.phone.trim() : '';
            const normalizedDob = lead.dob ? String(lead.dob).slice(0, 10) : null;
            const normalizedPreferredDate = lead.preferred_date ? String(lead.preferred_date).slice(0, 10) : null;

            const emailExpr = buildEmailExpr('c', hasEmail, hasFormData);
            const phoneExpr = buildPhoneExpr('c', hasPhone, hasFormData);
            let existingCustomerResult = { rows: [] as any[] };

            if (emailExpr !== 'NULL' || phoneExpr !== 'NULL') {
                const emailClause = emailExpr === 'NULL' ? 'FALSE' : `(${emailExpr} = $1 AND $1 IS NOT NULL)`;
                const phoneClause = phoneExpr === 'NULL' ? 'FALSE' : `(${phoneExpr} = $2 AND $2 IS NOT NULL)`;
                existingCustomerResult = await client.query(
                    `SELECT *
                     FROM customers c
                     WHERE ${emailClause}
                        OR ${phoneClause}
                     ORDER BY c.id DESC
                     LIMIT 1`,
                    [normalizedEmail || null, normalizedPhone || null]
                );
            }

            customerRow = existingCustomerResult.rows[0] || null;
            if (!customerRow) {
                const firstName = lead.first_name || 'Client';
                const lastName = lead.last_name || null;
                const concern = lead.concern || null;
                const hiddenToken = `lead-${id}-${Date.now()}`;
                const appointmentDate = normalizedPreferredDate ? `${normalizedPreferredDate} 09:00:00` : null;
                const formData = {
                    email: normalizedEmail,
                    first_name: firstName,
                    last_name: lastName,
                    phone: normalizedPhone,
                    dob: normalizedDob,
                    primary_concern: concern,
                    days_preference: normalizedPreferredDate ? [normalizedPreferredDate] : [],
                    timings_preference: []
                };

                const insertColumns: string[] = [];
                const insertValues: any[] = [];

                const addInsertField = (column: string, value: any) => {
                    if (!columns.has(column)) return;
                    insertColumns.push(column);
                    insertValues.push(value);
                };

                addInsertField('lead_id', id);
                addInsertField('hidden_form_token', hiddenToken);
                addInsertField('email', normalizedEmail || null);
                addInsertField('first_name', firstName);
                addInsertField('last_name', lastName);
                addInsertField('city', null);
                addInsertField('phone_number', normalizedPhone || null);
                addInsertField('occupation', null);
                addInsertField('dob', normalizedDob);
                addInsertField('primary_concern', concern);
                addInsertField('concern', concern);
                addInsertField('preference_visit', null);
                addInsertField('preferred_date', normalizedPreferredDate);
                addInsertField('preferred_slot', null);
                addInsertField('appointment_date', appointmentDate);
                addInsertField('slot', null);
                addInsertField('status', 'confirmed');
                addInsertField('is_active', true);
                addInsertField('form_data', JSON.stringify(formData));

                if (insertColumns.length === 0) {
                    throw new Error('No compatible columns found in customers table for lead acceptance insert.');
                }

                const placeholders = insertColumns.map((_, index) => {
                    const column = insertColumns[index];
                    if (column === 'dob') return `$${index + 1}::date`;
                    if (column === 'preferred_date') return `$${index + 1}::date`;
                    if (column === 'appointment_date') return `$${index + 1}::timestamp`;
                    if (column === 'form_data') return `$${index + 1}::jsonb`;
                    return `$${index + 1}`;
                });

                const customerResult = await client.query(
                    `INSERT INTO customers (${insertColumns.join(', ')})
                     VALUES (${placeholders.join(', ')})
                     RETURNING *`,
                    insertValues
                );
                customerRow = customerResult.rows[0];
            }

            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        // Send Confirmation Link Email (Directing to Public Intake Page)
        try {
            const frontendBaseUrl = (
                process.env.FRONTEND_URL ||
                process.env.PUBLIC_APP_URL ||
                'https://rewirewithkajal.vercel.app'
            ).replace(/\/$/, '');
            const formURL = `${frontendBaseUrl}/intake-form`;
            await sendEmail({
                to: lead.email,
                subject: 'Your Therapy Sessions have been Accepted! [Action Required]',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #FF8F4B;">Great News, ${lead.first_name}!</h2>
                        <p>We are thrilled to let you know that your consultation request has been accepted.</p>
                        <p>To finalize your sessions and become an official client, please fill out our highly detailed Intake Questionnaires. We use this to better understand your needs prior to the session.</p>
                        <div style="margin: 30px 0;">
                            <a href="${formURL}" style="background-color: #E67E3F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access Intake Form</a>
                        </div>
                        <p>Make sure to use the exact Email, Phone Number, and Date of Birth to link this to your accepted Lead Request!</p>
                        <p>Or copy this link to your browser: <a href="${formURL}">${formURL}</a></p>
                        <br/>
                        <p>Looking forward to our journey together,</p>
                        <p><strong>Rewire With Kajal</strong></p>
                    </div>
                `
            });
        } catch (mailError) {
            console.error('Failed to send acceptance email link:', mailError);
        }

        res.json({
            message: 'Lead accepted and moved to customers',
            lead,
            customer: customerRow
        });
    } catch (error: any) {
        console.error('Lead acceptance failed:', {
            message: error?.message,
            code: error?.code,
            detail: error?.detail,
            constraint: error?.constraint,
        });
        res.status(500).json({
            message: 'Failed to accept lead',
            code: error?.code,
            detail: error?.detail || error?.message || 'Unknown server error'
        });
    }
};

export const rejectLead = async (req: Request, res: Response) => {
    try {
        const leadColumns = await getLeadColumns();
        const { id } = req.params;

        const leadResult = leadColumns.has('status')
            ? await pool.query(
                'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
                ['rejected', id]
            )
            : await pool.query('SELECT * FROM leads WHERE id = $1 LIMIT 1', [id]);

        if (leadResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.json({
            message: 'Lead rejected',
            lead: leadResult.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const deleteLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.json({ message: 'Lead removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
