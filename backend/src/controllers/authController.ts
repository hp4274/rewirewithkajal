import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';

const generateToken = (id: number) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                id: admin.id,
                email: admin.email,
                token: generateToken(admin.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
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
        res.status(500).json({ message: 'Server Error' });
    }
};
