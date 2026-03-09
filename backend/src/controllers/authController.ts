import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { sendEmail } from '../utils/mailer';

const generateToken = (id: number) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

const normalizeEmail = (email: unknown): string => {
    return String(email || '').trim().toLowerCase();
};

let authSchemaInitPromise: Promise<void> | null = null;

const ensureAdminAuthSchema = async (): Promise<void> => {
    if (authSchemaInitPromise) {
        return authSchemaInitPromise;
    }

    authSchemaInitPromise = (async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                otp VARCHAR(10),
                otp_expires_at TIMESTAMP
            )
        `);

        await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp VARCHAR(10)');
        await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP');
        await pool.query('ALTER TABLE admins DROP COLUMN IF EXISTS password');
    })().catch((error) => {
        authSchemaInitPromise = null;
        throw error;
    });

    return authSchemaInitPromise;
};

export const sendOtp = async (req: Request, res: Response) => {
    try {
        await ensureAdminAuthSchema();

        const requestedEmail = normalizeEmail(req.body?.email);
        if (!requestedEmail) {
            return res.status(400).json({ message: 'Admin email is required' });
        }

        const adminResult = await pool.query('SELECT id FROM admins WHERE email = $1', [requestedEmail]);
        if (!adminResult.rows[0]) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await pool.query('UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE email = $3', [otp, otpExpiresAt, requestedEmail]);

        await sendEmail({
            to: requestedEmail,
            subject: 'Admin Login OTP',
            html: `<h3>Your Admin Portal Login OTP is: <strong>${otp}</strong></h3><p>This OTP is valid for 10 minutes.</p>`,
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        await ensureAdminAuthSchema();

        const { email, otp } = req.body;
        const requestedEmail = normalizeEmail(email);
        const requestedOtp = String(otp || '').trim();
        if (!requestedEmail || !requestedOtp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [requestedEmail]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.otp === requestedOtp && admin.otp_expires_at && new Date() < new Date(admin.otp_expires_at)) {
            // Clear OTP
            await pool.query('UPDATE admins SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [requestedEmail]);

            res.json({
                id: admin.id,
                email: requestedEmail,
                token: generateToken(admin.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const registerAdmin = async (req: Request, res: Response) => {
    try {
        await ensureAdminAuthSchema();

        const { email } = req.body;
        const requestedEmail = normalizeEmail(email);
        if (!requestedEmail) {
            return res.status(400).json({ message: 'Admin email is required' });
        }

        const adminExists = await pool.query('SELECT * FROM admins WHERE email = $1', [requestedEmail]);

        if (adminExists.rows.length > 0) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const result = await pool.query(
            'INSERT INTO admins (email) VALUES ($1) RETURNING id, email',
            [requestedEmail]
        );

        const admin = result.rows[0];

        res.status(201).json({
            id: admin.id,
            email: admin.email,
            token: generateToken(admin.id),
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
