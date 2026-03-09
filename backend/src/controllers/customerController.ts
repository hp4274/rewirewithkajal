import { Request, Response } from 'express';
import pool from '../db';
import { sendEmail } from '../utils/mailer';
import {
    buildAppointmentTimestamp,
    isDateTimeInPast,
    isDobNotFuture,
    isTodayOrFutureDate,
    isValidEmail,
    isValidMobile10,
    isValidSlotTime,
    normalizeDateInput
} from '../utils/validation';
import {
    ensureCurrentCustomerSessionRecord,
    ensureCustomerSessionsTable,
    normalizeSlotForSession
} from '../utils/sessionStorage';

let customerFormStorageInitPromise: Promise<void> | null = null;
let customerColumnsCachePromise: Promise<Set<string>> | null = null;
let customerSettingsTableInitPromise: Promise<void> | null = null;

const DEFAULT_PER_SESSION_PRICE = 1500;
const DEFAULT_TOTAL_SESSIONS = 4;
const shouldAutoDbSchemaSync =
    process.env.AUTO_DB_SCHEMA_SYNC === 'true' ||
    (!process.env.VERCEL && process.env.AUTO_DB_SCHEMA_SYNC !== 'false');

const parseStoredFormData = (raw: any): Record<string, any> => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};

const getYesScore = (items: any[]): number => {
    return items.reduce((sum, item) => {
        const answer = typeof item === 'object' && item !== null ? item.answer : item;
        return String(answer || '').trim().toLowerCase() === 'yes' ? sum + 10 : sum;
    }, 0);
};

const normalizeQuestionnaireItems = (items: any[]): Array<{ question: string; answer: string }> => {
    return items.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
            return {
                question: String(item.question || `Question ${index + 1}`),
                answer: String(item.answer || '')
            };
        }
        return {
            question: `Question ${index + 1}`,
            answer: String(item || '')
        };
    });
};

const buildCompatFormData = (row: any): Record<string, any> => {
    const persisted = parseStoredFormData(row.form_data);
    const q1 = Array.isArray(persisted.q1) ? persisted.q1 : [];
    const q2 = Array.isArray(persisted.q2) ? persisted.q2 : [];
    const computedScore = getYesScore(q1) + getYesScore(q2);
    const parsedStoredScore = Number(persisted.total_score);

    return {
        ...persisted,
        email: persisted.email ?? row.computed_email ?? row.email,
        first_name: persisted.first_name ?? row.computed_first ?? row.first_name,
        last_name: persisted.last_name ?? row.computed_last ?? row.last_name,
        city: persisted.city ?? row.city,
        phone: persisted.phone ?? row.computed_phone ?? row.phone_number,
        occupation: persisted.occupation ?? row.occupation,
        dob: persisted.dob ?? row.computed_dob ?? row.dob,
        primary_concern: persisted.primary_concern ?? row.concern ?? row.primary_concern,
        consultation_preference: persisted.consultation_preference ?? row.preference_visit,
        days_preference: Array.isArray(persisted.days_preference)
            ? persisted.days_preference
            : (row.preferred_date ? [row.preferred_date] : []),
        timings_preference: Array.isArray(persisted.timings_preference)
            ? persisted.timings_preference
            : (row.preferred_slot ? [row.preferred_slot] : []),
        q1,
        q2,
        total_score: Number.isFinite(parsedStoredScore) ? parsedStoredScore : computedScore
    };
};

const getCustomersColumns = async (): Promise<Set<string>> => {
    if (!customerColumnsCachePromise) {
        customerColumnsCachePromise = (async () => {
            const result = await pool.query(
                `SELECT column_name
                 FROM information_schema.columns
                 WHERE table_name = 'customers'
                   AND table_schema = ANY(current_schemas(false))`
            );
            return new Set(result.rows.map((row: any) => String(row.column_name)));
        })().catch((error) => {
            customerColumnsCachePromise = null;
            throw error;
        });
    }

    return customerColumnsCachePromise;
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

const ensureCustomerFormStorageSchema = async (): Promise<void> => {
    if (customerFormStorageInitPromise) {
        return customerFormStorageInitPromise;
    }

    customerFormStorageInitPromise = (async () => {
        await getCustomersColumns();
    })().catch(() => {
        customerFormStorageInitPromise = null;
    });

    return customerFormStorageInitPromise;
};

const ensureCustomerSettingsTable = async (): Promise<void> => {
    if (customerSettingsTableInitPromise) {
        return customerSettingsTableInitPromise;
    }

    customerSettingsTableInitPromise = (async () => {
        if (shouldAutoDbSchemaSync) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS customer_settings (
                    customer_id INTEGER PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
                    per_session_price INTEGER NOT NULL DEFAULT ${DEFAULT_PER_SESSION_PRICE},
                    total_sessions INTEGER NOT NULL DEFAULT ${DEFAULT_TOTAL_SESSIONS},
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query("ALTER TABLE customer_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true");
            await pool.query("ALTER TABLE customer_settings ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'confirmed'");
            return;
        }

        const existsResult = await pool.query("SELECT to_regclass('public.customer_settings') AS table_name");
        if (!existsResult.rows[0]?.table_name) {
            throw new Error('Table public.customer_settings is missing. Run migrations or set AUTO_DB_SCHEMA_SYNC=true for one-time bootstrap.');
        }
    })().catch((error) => {
        customerSettingsTableInitPromise = null;
        throw error;
    });

    return customerSettingsTableInitPromise;
};

export const getCustomerForms = async (req: Request, res: Response) => {
    try {
        await ensureCustomerFormStorageSchema();
        const { id } = req.params;
        const columns = await getCustomersColumns();
        const hasEmail = columns.has('email');
        const hasPhone = columns.has('phone_number');
        const hasFormData = columns.has('form_data');
        const currentEmailExpr = buildEmailExpr('c', hasEmail, hasFormData);
        const currentPhoneExpr = buildPhoneExpr('c', hasPhone, hasFormData);

        const currentCustQuery = `
            SELECT
                ${currentEmailExpr} AS email,
                ${currentPhoneExpr} AS phone
            FROM customers c
            WHERE c.id = $1
        `;
        const currentCust = await pool.query(currentCustQuery, [id]);

        if (currentCust.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const email = typeof currentCust.rows[0].email === 'string' ? currentCust.rows[0].email : null;
        const phone = typeof currentCust.rows[0].phone === 'string' ? currentCust.rows[0].phone : null;

        const formsEmailExpr = buildEmailExpr('c', hasEmail, hasFormData);
        const formsPhoneExpr = buildPhoneExpr('c', hasPhone, hasFormData);

        const formsQuery = `
            SELECT
                c.*
            FROM customers c
            WHERE
                c.id = $3
                OR (${formsEmailExpr} = $1 AND $1 IS NOT NULL)
                OR (${formsPhoneExpr} = $2 AND $2 IS NOT NULL)
            ORDER BY c.created_at DESC
        `;
        const formsResult = await pool.query(formsQuery, [email, phone, id]);

        const forms = formsResult.rows.map((row) => ({
            ...row,
            form_data: buildCompatFormData(row)
        }));

        res.json({ matchParams: { email, phone }, forms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        await ensureCustomerFormStorageSchema();
        await ensureCustomerSettingsTable();

        const columns = await getCustomersColumns();
        const hasEmail = columns.has('email');
        const hasPhone = columns.has('phone_number');
        const hasFormData = columns.has('form_data');
        const hasConcern = columns.has('primary_concern');
        const hasFirstName = columns.has('first_name');
        const hasLastName = columns.has('last_name');
        const hasDob = columns.has('dob');
        const hasPerSessionPrice = columns.has('per_session_price');
        const hasTotalSessions = columns.has('total_sessions');
        const hasLegacyIsActive = columns.has('is_active');
        const hasLegacyStatus = columns.has('status');

        const concernExpr = hasFormData
            ? hasConcern
                ? `COALESCE(c.primary_concern, NULLIF(TRIM(c.form_data->>'primary_concern'), ''))`
                : `NULLIF(TRIM(c.form_data->>'primary_concern'), '')`
            : hasConcern
                ? 'c.primary_concern'
                : 'NULL';
        const firstNameExpr = hasFormData
            ? hasFirstName
                ? `COALESCE(NULLIF(TRIM(c.first_name), ''), NULLIF(TRIM(c.form_data->>'first_name'), ''))`
                : `NULLIF(TRIM(c.form_data->>'first_name'), '')`
            : hasFirstName
                ? `NULLIF(TRIM(c.first_name), '')`
                : 'NULL';
        const lastNameExpr = hasFormData
            ? hasLastName
                ? `COALESCE(NULLIF(TRIM(c.last_name), ''), NULLIF(TRIM(c.form_data->>'last_name'), ''))`
                : `NULLIF(TRIM(c.form_data->>'last_name'), '')`
            : hasLastName
                ? `NULLIF(TRIM(c.last_name), '')`
                : 'NULL';
        const emailExpr = buildEmailExpr('c', hasEmail, hasFormData);
        const phoneExpr = buildPhoneExpr('c', hasPhone, hasFormData);
        const dobExpr = hasFormData
            ? hasDob
                ? `COALESCE(TO_CHAR(c.dob, 'YYYY-MM-DD'), NULLIF(TRIM(c.form_data->>'dob'), ''))`
                : `NULLIF(TRIM(c.form_data->>'dob'), '')`
            : hasDob
                ? `TO_CHAR(c.dob, 'YYYY-MM-DD')`
                : 'NULL';
        const legacyPriceExpr = hasPerSessionPrice ? 'c.per_session_price' : 'NULL';
        const legacySessionsExpr = hasTotalSessions ? 'c.total_sessions' : 'NULL';
        const legacyIsActiveExpr = hasLegacyIsActive ? 'c.is_active' : 'NULL';
        const legacyStatusExpr = hasLegacyStatus ? `NULLIF(TRIM(c.status), '')` : 'NULL';

        const query = `
      WITH RankedCustomers AS (
          SELECT
              c.*,
              COALESCE(cs.per_session_price, ${legacyPriceExpr}, ${DEFAULT_PER_SESSION_PRICE}) AS settings_per_session_price,
              COALESCE(cs.total_sessions, ${legacySessionsExpr}, ${DEFAULT_TOTAL_SESSIONS}) AS settings_total_sessions,
              COALESCE(cs.is_active, ${legacyIsActiveExpr}, true) AS settings_is_active,
              COALESCE(NULLIF(TRIM(cs.status), ''), ${legacyStatusExpr}, 'confirmed') AS settings_status,
              ${concernExpr} as concern,
              ${firstNameExpr} as computed_first,
              ${lastNameExpr} as computed_last,
              ${phoneExpr} as computed_phone,
              ${emailExpr} as computed_email,
              ${dobExpr} as computed_dob,
              ROW_NUMBER() OVER(
                  PARTITION BY
                      COALESCE(${emailExpr}, CONCAT('id:', c.id::text)),
                      COALESCE(${phoneExpr}, CONCAT('id:', c.id::text))
                  ORDER BY c.created_at DESC
              ) as rn
          FROM customers c
          LEFT JOIN customer_settings cs ON cs.customer_id = c.id
      )
      SELECT * FROM RankedCustomers
      WHERE rn = 1
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query);

        // Map computed fields back to standard expected format for frontend 'CustomerData' interface
        const normalizedRows = result.rows.map(row => ({
            ...row,
            name: `${row.computed_first || ''} ${row.computed_last || ''}`.trim() || 'N/A',
            email: row.computed_email,
            concern: row.concern,
            phone: row.computed_phone,
            dob: row.computed_dob,
            appointment_date: row.preferred_date,
            slot: row.preferred_slot,
            status: row.settings_status ?? row.status ?? 'confirmed',
            is_active: row.settings_is_active === false ? false : true,
            per_session_price: Number(row.settings_per_session_price ?? row.per_session_price ?? DEFAULT_PER_SESSION_PRICE),
            total_sessions: Number(row.settings_total_sessions ?? row.total_sessions ?? DEFAULT_TOTAL_SESSIONS),
            form_data: buildCompatFormData(row)
        }));

        res.json(normalizedRows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomerByToken = async (req: Request, res: Response) => {
    try {
        // Legacy hidden-token flow is retired; keep endpoint for backward compatibility.
        res.status(410).json({ message: 'This endpoint is deprecated. Use public form directly.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const submitHiddenForm = async (req: Request, res: Response) => {
    try {
        // Obsolete function since hidden tokens were removed.
        res.status(410).json({ message: 'This endpoint is deprecated. Use public form directly.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const submitPublicForm = async (req: Request, res: Response) => {
    try {
        await ensureCustomerFormStorageSchema();

        const form_data = req.body?.form_data || req.body || {};

        const email = typeof form_data?.email === 'string' ? form_data.email.trim().toLowerCase() : '';
        const firstName = typeof form_data?.first_name === 'string' ? form_data.first_name.trim() : '';
        const lastName = typeof form_data?.last_name === 'string' ? form_data.last_name.trim() : '';
        const city = typeof form_data?.city === 'string' ? form_data.city.trim() : null;
        const phone = typeof form_data?.phone === 'string' ? form_data.phone.trim() : '';
        const occupation = typeof form_data?.occupation === 'string' ? form_data.occupation.trim() : null;
        const dob = normalizeDateInput(form_data?.dob);
        const primaryConcern = typeof form_data?.primary_concern === 'string' ? form_data.primary_concern.trim() : null;

        const rawPreferenceVisit = String(form_data?.preference_visit || form_data?.consultation_preference || '').trim().toLowerCase();
        const preferenceVisit = rawPreferenceVisit === 'online' || rawPreferenceVisit === 'offline' ? rawPreferenceVisit : null;

        const daysPreferenceRaw = Array.isArray(form_data?.days_preference)
            ? form_data.days_preference
            : (form_data?.preferred_date ? [form_data.preferred_date] : []);
        const timingsPreferenceRaw = Array.isArray(form_data?.timings_preference)
            ? form_data.timings_preference
            : (form_data?.preferred_slot ? [form_data.preferred_slot] : []);

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        if (!firstName) {
            return res.status(400).json({ message: 'First name is required.' });
        }

        if (!isValidMobile10(phone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
        }

        if (!dob) {
            return res.status(400).json({ message: 'DOB must be in DD-MM-YYYY format.' });
        }

        if (!isDobNotFuture(dob)) {
            return res.status(400).json({ message: 'DOB cannot be in the future.' });
        }

        const normalizedDaysPreference: string[] = [];
        for (const dateValue of daysPreferenceRaw) {
            const normalizedDate = normalizeDateInput(dateValue);
            if (!normalizedDate) {
                return res.status(400).json({ message: 'Preferred date must be in DD-MM-YYYY format.' });
            }
            if (!isTodayOrFutureDate(normalizedDate)) {
                return res.status(400).json({ message: 'Preferred date cannot be in the past.' });
            }
            normalizedDaysPreference.push(normalizedDate);
        }

        const preferredDate = normalizedDaysPreference[0] || null;
        const preferredSlotCandidate = timingsPreferenceRaw.length > 0 ? String(timingsPreferenceRaw[0]).trim().slice(0, 5) : null;
        const preferredSlot = preferredSlotCandidate && isValidSlotTime(preferredSlotCandidate) ? preferredSlotCandidate : null;

        const questionnaireOne = normalizeQuestionnaireItems(Array.isArray(form_data?.q1) ? form_data.q1 : []);
        const questionnaireTwo = normalizeQuestionnaireItems(Array.isArray(form_data?.q2) ? form_data.q2 : []);
        const calculatedTotalScore = getYesScore(questionnaireOne) + getYesScore(questionnaireTwo);

        const persistedFormData = {
            ...parseStoredFormData(form_data),
            email,
            first_name: firstName,
            last_name: lastName || null,
            city,
            phone,
            occupation,
            dob,
            primary_concern: primaryConcern,
            consultation_preference: preferenceVisit,
            days_preference: normalizedDaysPreference,
            timings_preference: timingsPreferenceRaw,
            q1: questionnaireOne,
            q2: questionnaireTwo,
            total_score: calculatedTotalScore
        };

        const columns = await getCustomersColumns();
        const hasFormData = columns.has('form_data');

        let result;
        if (hasFormData) {
            result = await pool.query(
                `INSERT INTO customers
                (email, first_name, last_name, city, phone_number, occupation, dob, primary_concern, preference_visit, preferred_date, preferred_slot, form_data)
                VALUES($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10::date, $11, $12::jsonb) RETURNING * `,
                [
                    email,
                    firstName,
                    lastName || null,
                    city,
                    phone,
                    occupation,
                    dob,
                    primaryConcern,
                    preferenceVisit,
                    preferredDate,
                    preferredSlot,
                    JSON.stringify(persistedFormData)
                ]
            );
        } else {
            result = await pool.query(
                `INSERT INTO customers
                (email, first_name, last_name, city, phone_number, occupation, dob, primary_concern, preference_visit, preferred_date, preferred_slot)
                VALUES($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10::date, $11) RETURNING * `,
                [
                    email,
                    firstName,
                    lastName || null,
                    city,
                    phone,
                    occupation,
                    dob,
                    primaryConcern,
                    preferenceVisit,
                    preferredDate,
                    preferredSlot
                ]
            );
        }

        const newCustomer = result.rows[0];

        // Send a highly basic notification email back to the firm or patient (optional but good practice)
        if (email) {
            try {
                await sendEmail({
                    to: email,
                    subject: 'Rewire With Kajal - Intake Request Received',
                    html: `
        < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;" >
        <h2 style="color: #FF8F4B;" > Hello ${firstName}, </h2>
        < p > We have successfully received your intake and consultation preferences.</p>
        < p > Our team will review your answers and reach out to you directly shortly.</p>
        < br />
        <p>Warmly, </p>
        < p > <strong>Rewire With Kajal < /strong></p >
        </div>
            `
                });
            } catch (mailError) {
                console.error('Failed to send public intake confirmation email:', mailError);
            }
        }

        res.json({ message: 'Public form submitted successfully', customer: newCustomer });
    } catch (error) {
        console.error("Submit Public Form Error:", error);
        res.status(500).json({ message: 'Server Error processing your request.', error });
    }
};

export const updateCustomerStatus = async (req: Request, res: Response) => {
    try {
        res.status(410).json({ message: 'Customer status management is not part of schema_v4.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateCustomerAppointment = async (req: Request, res: Response) => {
    const client = await pool.connect();
    let queryStep = 'init';
    try {
        const { id } = req.params;
        const appointmentDateInput = req.body?.appointment_date ?? req.body?.preferred_date;
        const slotInput = req.body?.slot ?? req.body?.preferred_slot;
        const customerId = Number(id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({ message: 'Invalid customer id.' });
        }

        queryStep = 'begin-transaction';
        await client.query('BEGIN');
        queryStep = 'ensure-customer-sessions-table';
        await ensureCustomerSessionsTable(client);

        queryStep = 'fetch-customer-for-update';
        const customerResult = await client.query(
            `SELECT
                id,
                preferred_date,
                preferred_slot AS effective_slot
             FROM customers
             WHERE id = $1
             FOR UPDATE`,
            [customerId]
        );

        if (customerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Customer not found' });
        }

        queryStep = 'ensure-current-session-record';
        await ensureCurrentCustomerSessionRecord(client, customerId);

        const currentCustomer = customerResult.rows[0];
        const existingDate = normalizeDateInput(currentCustomer.preferred_date);
        const existingSlot = normalizeSlotForSession(currentCustomer.effective_slot);
        const isExistingPast = existingDate && existingSlot
            ? isDateTimeInPast(existingDate, existingSlot)
            : false;

        let isExistingLockedByPresence = false;
        if (existingDate && existingSlot) {
            queryStep = 'fetch-existing-session-lock';
            const existingSessionResult = await client.query(
                `SELECT presence_status, locked
                 FROM customer_sessions
                 WHERE customer_id = $1
                   AND session_date = $2::date
                   AND slot = $3
                 ORDER BY id DESC
                 LIMIT 1`,
                [customerId, existingDate, existingSlot]
            );

            if (existingSessionResult.rows.length > 0) {
                const existingSession = existingSessionResult.rows[0];
                isExistingLockedByPresence = existingSession.locked === true || existingSession.presence_status === 'present';
            }
        }

        if (!appointmentDateInput && !slotInput) {
            if (isExistingPast) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Cannot modify a session after its scheduled time has passed.' });
            }

            if (isExistingLockedByPresence) {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'This session is locked and cannot be edited.' });
            }

            queryStep = 'clear-appointment';
            const clearResult = await client.query(
                'UPDATE customers SET preferred_date = NULL, preferred_slot = NULL WHERE id = $1 RETURNING *',
                [customerId]
            );

            await client.query('COMMIT');
            return res.json(clearResult.rows[0]);
        }

        if (!appointmentDateInput || !slotInput) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Appointment date and slot are both required.' });
        }

        const normalizedDate = normalizeDateInput(appointmentDateInput);
        const normalizedSlot = String(slotInput).trim().slice(0, 5);

        if (!normalizedDate) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Slot booking date must be in DD-MM-YYYY format.' });
        }

        if (!isTodayOrFutureDate(normalizedDate)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Slot booking date cannot be in the past.' });
        }

        if (!isValidSlotTime(normalizedSlot)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Slot time must be in HH:mm format.' });
        }

        if (isDateTimeInPast(normalizedDate, normalizedSlot)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot book a past time slot.' });
        }

        const isSameAsExisting = existingDate === normalizedDate && existingSlot === normalizedSlot;
        if (!isSameAsExisting && isExistingPast) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cannot modify a session after its scheduled time has passed.' });
        }

        if (!isSameAsExisting && isExistingLockedByPresence) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'This session is locked and cannot be edited.' });
        }

        queryStep = 'check-existing-self-booking';
        const alreadyBookedForCustomer = await client.query(
            `SELECT id FROM customers
                         WHERE id = $1
                             AND preferred_date = $2::date
                             AND preferred_slot = $3::text`,
            [customerId, normalizedDate, normalizedSlot]
        );

        if (!isSameAsExisting && alreadyBookedForCustomer.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                message: 'This customer already has an appointment at the selected date and time.',
                conflict: true
            });
        }

        // Check for slot overlap on the same date+time across all other customers.
        queryStep = 'check-slot-conflict-other-customers';
        const conflictCheck = await client.query(
            `SELECT c.id, 
                    COALESCE(c.first_name, 'Another Customer') as first_name,
                    COALESCE(c.last_name, '') as last_name
             FROM customers c 
             WHERE c.preferred_date = $1::date
                                      AND c.preferred_slot = $2::text
                    AND c.id != $3`,
                [normalizedDate, normalizedSlot, customerId]
        );

        if (conflictCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            const conf = conflictCheck.rows[0];
            const conflictName = `${conf.first_name} ${conf.last_name}`.trim();
            return res.status(409).json({
                message: `Slot already booked by ${conflictName}.`,
                conflict: true
            });
        }

        queryStep = 'check-slot-conflict-session-table';
        const sessionConflict = await client.query(
            `SELECT id FROM customer_sessions
             WHERE session_date = $1::date
               AND slot = $2
               AND customer_id != $3
             LIMIT 1`,
            [normalizedDate, normalizedSlot, customerId]
        );

        if (sessionConflict.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                message: 'Slot already exists in session schedule for another customer.',
                conflict: true
            });
        }

        // Keep the validation behavior for date+slot but persist as separate DATE + slot.
        buildAppointmentTimestamp(normalizedDate, normalizedSlot);


        queryStep = 'update-customer-appointment';
        const result = await client.query(
            'UPDATE customers SET preferred_date = $1::date, preferred_slot = $2 WHERE id = $3 RETURNING *',
            [normalizedDate, normalizedSlot, customerId]
        );

        queryStep = 'insert-session-row-if-missing';
        const existingUnmarkedSession = await client.query(
            `SELECT id
             FROM customer_sessions
             WHERE customer_id = $1
               AND presence_status = 'not_marked'
               AND COALESCE(locked, false) = false
             ORDER BY updated_at DESC, id DESC
             LIMIT 1
             FOR UPDATE`,
            [customerId]
        );

        if (existingUnmarkedSession.rows.length > 0) {
            await client.query(
                `UPDATE customer_sessions
                 SET session_date = $1::date,
                     slot = CAST($2 AS VARCHAR(5)),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [normalizedDate, normalizedSlot, existingUnmarkedSession.rows[0].id]
            );
        } else {
            await client.query(
                `INSERT INTO customer_sessions (customer_id, session_date, slot, presence_status, locked, updated_at)
                 SELECT $1, $2::date, CAST($3 AS VARCHAR(5)), 'not_marked', false, CURRENT_TIMESTAMP
                 WHERE NOT EXISTS (
                    SELECT 1 FROM customer_sessions
                    WHERE customer_id = $1 AND session_date = $2::date AND slot = CAST($4 AS VARCHAR(5))
                 )`,
                [customerId, normalizedDate, normalizedSlot, normalizedSlot]
            );
        }

        queryStep = 'commit-transaction';
        await client.query('COMMIT');

        res.json({ ...result.rows[0], appointment_date: result.rows[0].preferred_date, slot: result.rows[0].preferred_slot });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {
            // Ignore rollback failure and return original error.
        }
        console.error("Update Appointment Error:", { queryStep, error });
        res.status(500).json({ message: 'Server Error', error });
    } finally {
        client.release();
    }
};

