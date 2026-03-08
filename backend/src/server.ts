import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import pool from './db';
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';
import leadRoutes from './routes/leadRoutes';
import customerRoutes from './routes/customerRoutes';
import adminExtrasRoutes from './routes/adminExtrasRoutes';
import { UPLOAD_DIR } from './middleware/upload';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');

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
app.use('/uploads', express.static(UPLOAD_DIR));

// In production, serve the React app from the same Node process.
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendBuildPath));
}

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

if (process.env.NODE_ENV === 'production') {
    app.get(/.*/, (req: Request, res: Response, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}

if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
