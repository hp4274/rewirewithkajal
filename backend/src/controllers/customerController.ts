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

export const getCustomerForms = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentCustQuery = `
            SELECT 
                c.email,
                c.phone_number as phone
            FROM customers c
            WHERE c.id = $1
        `;
        const currentCust = await pool.query(currentCustQuery, [id]);

        if (currentCust.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const { email, phone } = currentCust.rows[0];

        const formsQuery = `
            SELECT 
                c.*
            FROM customers c
            WHERE 
                (LOWER(c.email) = LOWER($1) AND $1 IS NOT NULL)
                OR 
                (c.phone_number = $2 AND $2 IS NOT NULL)
            ORDER BY c.created_at DESC
        `;
        const formsResult = await pool.query(formsQuery, [email, phone]);

        const forms = formsResult.rows.map((row) => ({
            ...row,
            form_data: {
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                city: row.city,
                phone: row.phone_number,
                occupation: row.occupation,
                dob: row.dob,
                primary_concern: row.primary_concern,
                consultation_preference: row.preference_visit,
                days_preference: row.preferred_date ? [row.preferred_date] : [],
                timings_preference: row.preferred_slot ? [row.preferred_slot] : [],
                q1: [],
                q2: []
            }
        }));

        res.json({ matchParams: { email, phone }, forms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const query = `
      WITH RankedCustomers AS (
          SELECT 
              c.*, 
              c.primary_concern as concern,
              c.first_name as computed_first,
              c.last_name as computed_last,
              c.phone_number as computed_phone,
              c.email as computed_email,
              TO_CHAR(c.dob, 'YYYY-MM-DD') as computed_dob,
              ROW_NUMBER() OVER(
                  PARTITION BY 
                      COALESCE(NULLIF(LOWER(c.email), ''), CONCAT('id:', c.id::text)),
                      COALESCE(NULLIF(c.phone_number, ''), CONCAT('id:', c.id::text))
                  ORDER BY c.created_at DESC
              ) as rn
          FROM customers c
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
            status: 'confirmed',
            is_active: true,
            per_session_price: 0,
            total_sessions: 0,
            form_data: {
                email: row.computed_email,
                first_name: row.computed_first,
                last_name: row.computed_last,
                city: row.city,
                phone: row.computed_phone,
                occupation: row.occupation,
                dob: row.computed_dob,
                primary_concern: row.concern,
                consultation_preference: row.preference_visit,
                days_preference: row.preferred_date ? [row.preferred_date] : [],
                timings_preference: row.preferred_slot ? [row.preferred_slot] : []
            }
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

        const result = await pool.query(
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

