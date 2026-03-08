import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { sendEmail } from '../utils/mailer';

const generateToken = (id: number) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

const getConfiguredAdminEmail = (): string => {
    return (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '').trim().toLowerCase();
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
                password VARCHAR(255) NOT NULL,
                otp VARCHAR(10),
                otp_expires_at TIMESTAMP
            )
        `);

        await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp VARCHAR(10)');
        await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP');
    })().catch((error) => {
        authSchemaInitPromise = null;
        throw error;
    });

    return authSchemaInitPromise;
};

const ensureConfiguredAdminRecord = async (adminEmail: string) => {
    await ensureAdminAuthSchema();

    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);
    if (existing.rows[0]) {
        return existing.rows[0].id as number;
    }

    // Placeholder password is only to satisfy NOT NULL schema in OTP-first login flow.
    const placeholderHash = await bcrypt.hash(process.env.JWT_SECRET || 'secret', 10);
    const created = await pool.query(
        'INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id',
        [adminEmail, placeholderHash]
    );
    return created.rows[0].id as number;
};

export const sendOtp = async (req: Request, res: Response) => {
    try {
        await ensureAdminAuthSchema();

        const configuredAdminEmail = getConfiguredAdminEmail();
        if (!configuredAdminEmail) {
            return res.status(500).json({ message: 'ADMIN_EMAIL is not configured' });
        }

        const requestedEmail = normalizeEmail(req.body?.email);
        if (requestedEmail && requestedEmail !== configuredAdminEmail) {
            return res.status(403).json({ message: 'Unauthorized admin email' });
        }

        await ensureConfiguredAdminRecord(configuredAdminEmail);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await pool.query('UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE email = $3', [otp, otpExpiresAt, configuredAdminEmail]);

        await sendEmail({
            to: configuredAdminEmail,
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
        const configuredAdminEmail = getConfiguredAdminEmail();
        if (!configuredAdminEmail) {
            return res.status(500).json({ message: 'ADMIN_EMAIL is not configured' });
        }

        const requestedEmail = normalizeEmail(email);
        if (requestedEmail !== configuredAdminEmail) {
            return res.status(403).json({ message: 'Unauthorized admin email' });
        }

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [configuredAdminEmail]);
        const admin = result.rows[0];

        if (admin && admin.otp === otp && new Date() < new Date(admin.otp_expires_at)) {
            // Clear OTP
            await pool.query('UPDATE admins SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [configuredAdminEmail]);

            res.json({
                id: admin.id,
                email: configuredAdminEmail,
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

        const { email, password } = req.body;
        const configuredAdminEmail = getConfiguredAdminEmail();
        if (!configuredAdminEmail) {
            return res.status(500).json({ message: 'ADMIN_EMAIL is not configured' });
        }

        const requestedEmail = normalizeEmail(email);
        if (requestedEmail !== configuredAdminEmail) {
            return res.status(403).json({ message: 'Email must match configured ADMIN_EMAIL' });
        }

        const adminExists = await pool.query('SELECT * FROM admins WHERE email = $1', [configuredAdminEmail]);

        if (adminExists.rows.length > 0) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id, email',
            [configuredAdminEmail, hashedPassword]
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
