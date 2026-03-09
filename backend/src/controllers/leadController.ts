import { Request, Response } from 'express';
import pool from '../db';
import { sendEmail } from '../utils/mailer';
import {
    isDobNotFuture,
    isTodayOrFutureDate,
    isValidEmail,
    isValidMobile10,
    normalizeDateInput
} from '../utils/validation';

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
        const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        const leads = result.rows.map(row => ({
            ...row,
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim()
        }));
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const acceptLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const leadResult = await pool.query(
            'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
            ['accepted', id]
        );

        if (leadResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        const lead = leadResult.rows[0];

        const normalizedEmail = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';
        const normalizedPhone = typeof lead.phone === 'string' ? lead.phone.trim() : '';
        const normalizedDob = lead.dob ? String(lead.dob).slice(0, 10) : null;
        const normalizedPreferredDate = lead.preferred_date ? String(lead.preferred_date).slice(0, 10) : null;

        const existingCustomerResult = await pool.query(
            `SELECT *
             FROM customers
             WHERE LOWER(email) = LOWER($1)
               AND phone_number = $2
             ORDER BY created_at DESC
             LIMIT 1`,
            [normalizedEmail, normalizedPhone]
        );

        let customerRow = existingCustomerResult.rows[0] || null;
        if (!customerRow) {
            const customerResult = await pool.query(
                `INSERT INTO customers
                    (email, first_name, last_name, city, phone_number, occupation, dob, primary_concern, preference_visit, preferred_date, preferred_slot)
                 VALUES ($1, $2, $3, NULL, $4, NULL, $5::date, $6, NULL, $7::date, NULL)
                 RETURNING *`,
                [
                    normalizedEmail,
                    lead.first_name || 'Client',
                    lead.last_name || null,
                    normalizedPhone,
                    normalizedDob,
                    lead.concern || null,
                    normalizedPreferredDate
                ]
            );
            customerRow = customerResult.rows[0];
        }

        // Send Confirmation Link Email (Directing to Public Intake Page)
        try {
            const formURL = `http://localhost:3000/intake-form`;
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
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const rejectLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const leadResult = await pool.query(
            'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
            ['rejected', id]
        );

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
