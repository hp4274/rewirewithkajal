import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import pool from './db';
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';
import leadRoutes from './routes/leadRoutes';
import customerRoutes from './routes/customerRoutes';
import adminExtrasRoutes from './routes/adminExtrasRoutes';
import { UPLOAD_DIR } from './middleware/upload';
import {
    getRequestMetricsSnapshot,
    rateLimitMiddleware,
    requestMetricsMiddleware,
    requestTimeoutMiddleware,
} from './middleware/performanceMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');

// Middleware
app.set('trust proxy', 1);
app.use(cors());
app.use(compression({ threshold: 1024 }));
app.use(requestTimeoutMiddleware);
app.use(rateLimitMiddleware);
app.use(requestMetricsMiddleware);
app.use(express.json({ limit: '1mb' }));

app.use('/api', (req: Request, res: Response, next) => {
    // Dynamic API responses should be fetched fresh unless a specific handler overrides this.
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminExtrasRoutes);

// Statically serve uploads folder
app.use('/uploads', express.static(UPLOAD_DIR, {
    maxAge: '7d',
    etag: true,
}));

// In production, serve the React app from the same Node process.
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendBuildPath, {
        maxAge: '1h',
        etag: true,
        setHeaders: (res, filePath) => {
            if (/\\.[a-f0-9]{8,}\\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        },
    }));
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

app.get('/api/health/perf', (req: Request, res: Response) => {
    res.json({
        routes: getRequestMetricsSnapshot().slice(0, 20),
    });
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
