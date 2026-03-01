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
