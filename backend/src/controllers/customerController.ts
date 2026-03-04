import { Request, Response } from 'express';
import pool from '../db';
import { sendEmail } from '../utils/mailer';

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

        res.json({ matchParams: { email, phone }, forms: formsResult.rows });
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

        // This inserts a new customer entirely, without binding to a lead or a token
        const result = await pool.query(
            `INSERT INTO customers
            (status, form_data) 
            VALUES($1, $2) RETURNING * `,
            ['pending', form_data || '{}']
        );

        const newCustomer = result.rows[0];

        // Send a highly basic notification email back to the firm or patient (optional but good practice)
        if (form_data && form_data.email) {
            try {
                await sendEmail({
                    to: form_data.email,
                    subject: 'Rewire With Kajal - Intake Request Received',
                    html: `
        < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;" >
        <h2 style="color: #FF8F4B;" > Hello ${form_data.first_name}, </h2>
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
    try {
        const { id } = req.params;
        const { appointment_date, slot } = req.body;

        if (appointment_date) {
            // Check for conflicts: another customer with the same appointment_date (timestamp)
            // We join with leads to get the name if available, otherwise fallback to form_data
            const conflictCheck = await pool.query(
                `SELECT c.id, 
                        COALESCE(l.first_name, c.form_data->>'first_name', 'Another Customer') as first_name,
                        COALESCE(l.last_name, c.form_data->>'last_name', '') as last_name
                 FROM customers c 
                 LEFT JOIN leads l ON c.lead_id = l.id
                 WHERE c.appointment_date = $1 AND c.id != $2`,
                [appointment_date, id]
            );

            if (conflictCheck.rows.length > 0) {
                const conf = conflictCheck.rows[0];
                const conflictName = `${conf.first_name} ${conf.last_name}`.trim();
                return res.status(409).json({
                    message: `Slot already booked by ${conflictName}.`,
                    conflict: true
                });
            }
        }


        const result = await pool.query(
            'UPDATE customers SET appointment_date = $1, slot = $2 WHERE id = $3 RETURNING *',
            [appointment_date || null, slot || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update Appointment Error:", error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

