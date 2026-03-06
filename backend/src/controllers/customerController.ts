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
                COALESCE(l.email, c.form_data->>'email') as email,
                COALESCE(l.phone, c.form_data->>'phone') as phone
            FROM customers c
            LEFT JOIN leads l ON c.lead_id = l.id
            WHERE c.id = $1
        `;
        const currentCust = await pool.query(currentCustQuery, [id]);

        if (currentCust.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const { email, phone } = currentCust.rows[0];

        const formsQuery = `
            SELECT 
                c.id, c.created_at, c.form_data
            FROM customers c
            LEFT JOIN leads l ON c.lead_id = l.id
            WHERE 
                (COALESCE(l.email, c.form_data->>'email') = $1 AND $1 IS NOT NULL)
                OR 
                (COALESCE(l.phone, c.form_data->>'phone') = $2 AND $2 IS NOT NULL)
            ORDER BY c.created_at DESC
        `;
        const formsResult = await pool.query(formsQuery, [email, phone]);

        // Filter out empty shells created by accepting a Lead
        const validForms = formsResult.rows.filter(form =>
            form.form_data && Array.isArray(form.form_data.q1) && Array.isArray(form.form_data.q2)
        );

        // Deduplicate forms that have identically matching form_data (prevent double-submit bugs)
        const uniqueForms = validForms.filter((form, index, self) =>
            index === self.findIndex((t) => JSON.stringify(t.form_data) === JSON.stringify(form.form_data))
        );

        res.json({ matchParams: { email, phone }, forms: uniqueForms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        // Deduplicate strategy:
        // We partition by the 2 unique identifiers (email and phone) to merge multiple form submissions.
        // We use COALESCE to gracefully fall back on the Leads table data OR the Public Intake Form JSON data.
        const query = `
      WITH RankedCustomers AS (
          SELECT 
              c.*, 
              l.first_name AS lead_first_name, 
              l.last_name AS lead_last_name, 
              l.email AS lead_email, 
              l.phone as lead_phone, 
              l.dob as lead_dob,
              COALESCE(l.concern, c.form_data->>'concern', c.form_data->>'primary_concern') as concern, 
              c.form_data,
              COALESCE(l.first_name, c.form_data->>'first_name') as computed_first,
              COALESCE(l.last_name, c.form_data->>'last_name') as computed_last,
              COALESCE(l.phone, c.form_data->>'phone') as computed_phone,
              COALESCE(l.email, c.form_data->>'email') as computed_email,
              COALESCE(TO_CHAR(l.dob, 'YYYY-MM-DD'), c.form_data->>'dob') as computed_dob,
              ROW_NUMBER() OVER(
                  PARTITION BY 
                      COALESCE(l.email, c.form_data->>'email'),
                      COALESCE(l.phone, c.form_data->>'phone')
                  ORDER BY c.created_at DESC
              ) as rn
          FROM customers c 
          LEFT JOIN leads l ON c.lead_id = l.id
      )
      SELECT * FROM RankedCustomers 
      WHERE rn = 1
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query);

        // Map computed fields back to standard expected format for frontend 'CustomerData' interface
        const normalizedRows = result.rows.map(row => ({
            ...row,
            name: `${row.computed_first || ''} ${row.computed_last || ''}`.trim(),
            email: row.computed_email,
            concern: row.concern,
            phone: row.computed_phone,
            dob: row.computed_dob
        }));

        res.json(normalizedRows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getCustomerByToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const query = `
      SELECT c.*, l.name, l.email 
      FROM customers c 
      JOIN leads l ON c.lead_id = l.id 
      WHERE c.hidden_form_token = $1
            `;
        const result = await pool.query(query, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired form link' });
        }

        res.json(result.rows[0]);
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
        const { form_data } = req.body;

        const email = typeof form_data?.email === 'string' ? form_data.email.trim().toLowerCase() : '';
        const phone = typeof form_data?.phone === 'string' ? form_data.phone.trim() : '';
        const dob = normalizeDateInput(form_data?.dob);
        const daysPreferenceRaw = Array.isArray(form_data?.days_preference) ? form_data.days_preference : [];

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
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

        if (daysPreferenceRaw.length === 0) {
            return res.status(400).json({ message: 'At least one preferred date is required.' });
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

        const sanitizedFormData = {
            ...(form_data || {}),
            email,
            phone,
            dob,
            days_preference: normalizedDaysPreference
        };

        // This inserts a new customer entirely, without binding to a lead or a token
        const result = await pool.query(
            `INSERT INTO customers
            (status, form_data) 
            VALUES($1, $2) RETURNING * `,
            ['pending', sanitizedFormData]
        );

        const newCustomer = result.rows[0];

        // Send a highly basic notification email back to the firm or patient (optional but good practice)
        if (sanitizedFormData && sanitizedFormData.email) {
            try {
                await sendEmail({
                    to: sanitizedFormData.email,
                    subject: 'Rewire With Kajal - Intake Request Received',
                    html: `
        < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;" >
        <h2 style="color: #FF8F4B;" > Hello ${sanitizedFormData.first_name}, </h2>
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
        const { id } = req.params;
        const { status } = req.body; // pending, confirmed, declined

        const isActive = status === 'confirmed';

        const result = await pool.query(
            'UPDATE customers SET status = $1, is_active = $2 WHERE id = $3 RETURNING *',
            [status, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateCustomerAppointment = async (req: Request, res: Response) => {
    const client = await pool.connect();
    let queryStep = 'init';
    try {
        const { id } = req.params;
        const { appointment_date, slot } = req.body;
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
                appointment_date,
                COALESCE(NULLIF(slot, ''), TO_CHAR(appointment_date, 'HH24:MI')) AS effective_slot
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
        const existingDate = normalizeDateInput(currentCustomer.appointment_date);
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

        if (!appointment_date && !slot) {
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
                'UPDATE customers SET appointment_date = NULL, slot = NULL WHERE id = $1 RETURNING *',
                [customerId]
            );

            await client.query('COMMIT');
            return res.json(clearResult.rows[0]);
        }

        if (!appointment_date || !slot) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Appointment date and slot are both required.' });
        }

        const normalizedDate = normalizeDateInput(appointment_date);
        const normalizedSlot = String(slot).trim().slice(0, 5);

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
                             AND DATE(appointment_date) = $2::date
                             AND COALESCE(NULLIF(slot, '')::text, TO_CHAR(appointment_date, 'HH24:MI')) = $3::text`,
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
                    COALESCE(l.first_name, c.form_data->>'first_name', 'Another Customer') as first_name,
                    COALESCE(l.last_name, c.form_data->>'last_name', '') as last_name
             FROM customers c 
             LEFT JOIN leads l ON c.lead_id = l.id
             WHERE DATE(c.appointment_date) = $1::date
                                      AND COALESCE(NULLIF(c.slot, '')::text, TO_CHAR(c.appointment_date, 'HH24:MI')) = $2::text
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

        const appointmentTimestamp = buildAppointmentTimestamp(normalizedDate, normalizedSlot);


        queryStep = 'update-customer-appointment';
        const result = await client.query(
            'UPDATE customers SET appointment_date = $1, slot = $2 WHERE id = $3 RETURNING *',
            [appointmentTimestamp, normalizedSlot, customerId]
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

        res.json(result.rows[0]);
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

