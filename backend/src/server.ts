import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';
import leadRoutes from './routes/leadRoutes';
import customerRoutes from './routes/customerRoutes';
import adminExtrasRoutes from './routes/adminExtrasRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminExtrasRoutes);

// Statically serve uploads folder
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic health check route
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const dbRes = await pool.query('SELECT NOW()');
        res.json({
            status: 'UP',
            database: 'Connected',
            time: dbRes.rows[0].now,
        });
    } catch (error) {
        res.status(500).json({
            status: 'DOWN',
            database: 'Disconnected',
            error: (error as Error).message,
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
