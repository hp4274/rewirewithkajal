import { Request, Response } from 'express';
import pool from '../db';

export const getCustomerPayments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM payments WHERE customer_id = $1 ORDER BY payment_date ASC', [id]);
        res.json(result.rows);
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
        const { is_active, per_session_price, total_sessions } = req.body;

        const result = await pool.query(
            'UPDATE customers SET is_active = $1, per_session_price = $2, total_sessions = $3 WHERE id = $4 RETURNING *',
            [is_active, per_session_price, total_sessions, id]
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

export const getHistoricalForms = async (req: Request, res: Response) => {
    try {
        const { phone, dob } = req.query;
        if (!phone || !dob) return res.status(400).json({ message: 'Phone number and DOB required for secure matching' });

        // Using jsonb extraction operator ->> to match phone and dob inside form_data
        const query = `
            SELECT * FROM customers 
            WHERE form_data->>'phone' = $1 AND form_data->>'dob' = $2
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [phone, dob]);
        res.json(result.rows);
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
