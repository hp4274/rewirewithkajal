import { Request, Response } from 'express';
import pool from '../db';
import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '../middleware/upload';

let blogImagesInitPromise: Promise<void> | null = null;

const ensureBlogImagesTable = async (): Promise<void> => {
    if (!blogImagesInitPromise) {
        blogImagesInitPromise = (async () => {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS blog_images (
                    filename VARCHAR(255) PRIMARY KEY,
                    mime_type VARCHAR(100) NOT NULL,
                    content BYTEA NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        })().catch((error) => {
            blogImagesInitPromise = null;
            throw error;
        });
    }

    await blogImagesInitPromise;
};

export const getBlogs = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).admin ? true : false;

        // If not admin, only show active blogs.
        const query = isAdmin
            ? 'SELECT * FROM blogs ORDER BY created_at DESC'
            : 'SELECT * FROM blogs WHERE is_active = true ORDER BY created_at DESC';

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const createBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, image_url, is_active } = req.body;

        const result = await pool.query(
            'INSERT INTO blogs (title, content, image_url, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, image_url, is_active || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, image_url, is_active } = req.body;

        const result = await pool.query(
            'UPDATE blogs SET title = $1, content = $2, image_url = $3, is_active = $4 WHERE id = $5 RETURNING *',
            [title, content, image_url, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json({ message: 'Blog removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const uploadBlogImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        await ensureBlogImagesTable();

        const fileBuffer = await fs.readFile(req.file.path);
        const mimeType = (req.file.mimetype || '').startsWith('image/')
            ? req.file.mimetype
            : 'application/octet-stream';

        await pool.query(
            `INSERT INTO blog_images (filename, mime_type, content)
             VALUES ($1, $2, $3)
             ON CONFLICT (filename)
             DO UPDATE SET
                mime_type = EXCLUDED.mime_type,
                content = EXCLUDED.content,
                created_at = CURRENT_TIMESTAMP`,
            [req.file.filename, mimeType, fileBuffer]
        );

        await fs.unlink(req.file.path).catch(() => {
            // Ignore cleanup failures in serverless temp directory.
        });

        const imageUrl = `/api/blogs/image/${encodeURIComponent(req.file.filename)}`;

        res.status(200).json({ image_url: imageUrl });
    } catch (error) {
        console.error("Upload error details:", error);
        res.status(500).json({ message: 'Image upload failed', error });
    }
};

export const getBlogImage = async (req: Request, res: Response) => {
    try {
        const filenameParam = typeof req.params?.filename === 'string' ? req.params.filename : '';
        const filename = path.basename(decodeURIComponent(filenameParam)).trim();

        if (!filename) {
            return res.status(400).json({ message: 'Invalid image filename.' });
        }

        await ensureBlogImagesTable();

        const result = await pool.query(
            `SELECT mime_type, content
             FROM blog_images
             WHERE filename = $1
             LIMIT 1`,
            [filename]
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.status(200).send(row.content);
        }

        // Backward compatibility for any local legacy files.
        const legacyPath = path.join(UPLOAD_DIR, filename);
        const legacyBuffer = await fs.readFile(legacyPath);
        const ext = path.extname(filename).toLowerCase();
        const legacyMimeType = ext === '.png'
            ? 'image/png'
            : ext === '.webp'
                ? 'image/webp'
                : ext === '.gif'
                    ? 'image/gif'
                    : 'image/jpeg';

        // Self-heal legacy uploads: once found on disk, persist into DB for all future requests.
        await pool.query(
            `INSERT INTO blog_images (filename, mime_type, content)
             VALUES ($1, $2, $3)
             ON CONFLICT (filename)
             DO UPDATE SET
                mime_type = EXCLUDED.mime_type,
                content = EXCLUDED.content,
                created_at = CURRENT_TIMESTAMP`,
            [filename, legacyMimeType, legacyBuffer]
        );

        res.setHeader('Content-Type', legacyMimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(legacyBuffer);
    } catch {
        return res.status(404).json({ message: 'Image not found.' });
    }
};
