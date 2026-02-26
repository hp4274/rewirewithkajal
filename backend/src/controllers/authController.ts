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

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await pool.query('UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE email = $3', [otp, otpExpiresAt, email]);

        await sendEmail({
            to: email,
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
        const { email, otp } = req.body;

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (admin && admin.otp === otp && new Date() < new Date(admin.otp_expires_at)) {
            // Clear OTP
            await pool.query('UPDATE admins SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [email]);

            res.json({
                id: admin.id,
                email: admin.email,
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
        const { email, password } = req.body;

        const adminExists = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);

        if (adminExists.rows.length > 0) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
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
