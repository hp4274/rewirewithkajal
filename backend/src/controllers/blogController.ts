import { Request, Response } from 'express';
import pool from '../db';
import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '../middleware/upload';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';

let blogImagesInitPromise: Promise<void> | null = null;
const PUBLIC_BLOGS_CACHE_TTL_MS = 60_000;
const publicBlogsCache = new Map<string, { expiresAt: number; payload: any }>();
const shouldAutoDbSchemaSync =
    process.env.AUTO_DB_SCHEMA_SYNC === 'true' ||
    (!process.env.VERCEL && process.env.AUTO_DB_SCHEMA_SYNC !== 'false');

const ensureBlogImagesTable = async (): Promise<void> => {
    if (!blogImagesInitPromise) {
        blogImagesInitPromise = (async () => {
            if (shouldAutoDbSchemaSync) {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS blog_images (
                        filename VARCHAR(255) PRIMARY KEY,
                        mime_type VARCHAR(100) NOT NULL,
                        content BYTEA NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                return;
            }

            const existsResult = await pool.query("SELECT to_regclass('public.blog_images') AS table_name");
            if (!existsResult.rows[0]?.table_name) {
                throw new Error('Table public.blog_images is missing. Run migrations or set AUTO_DB_SCHEMA_SYNC=true for one-time bootstrap.');
            }
        })().catch((error) => {
            blogImagesInitPromise = null;
            throw error;
        });
    }

    await blogImagesInitPromise;
};

const clearPublicBlogsCache = () => {
    publicBlogsCache.clear();
};

const getCachedPublicBlogs = (key: string) => {
    const hit = publicBlogsCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
        publicBlogsCache.delete(key);
        return null;
    }
    return hit.payload;
};

const setCachedPublicBlogs = (key: string, payload: any) => {
    publicBlogsCache.set(key, {
        payload,
        expiresAt: Date.now() + PUBLIC_BLOGS_CACHE_TTL_MS,
    });
};

const parseBooleanQuery = (value: unknown, defaultValue: boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    }

    return defaultValue;
};

const normalizeBlogCategory = (value: unknown): string => {
    if (typeof value !== 'string') return 'Mindfulness';

    const normalized = value.trim().toLowerCase();
    if (normalized === 'anxiety') return 'Anxiety';
    if (normalized === 'relationship' || normalized === 'relationships') return 'Relationships';
    if (normalized === 'self-growth' || normalized === 'self growth' || normalized === 'selfgrowth') return 'Self-Growth';
    if (normalized === 'trauma') return 'Trauma';
    if (normalized === 'mindfull' || normalized === 'mindful' || normalized === 'mindfulness') return 'Mindfulness';

    return 'Mindfulness';
};

export const getBlogs = async (req: Request, res: Response) => {
    try {
        const isAdmin = (req as any).admin ? true : false;
        const summaryMode = parseBooleanQuery(req.query.summary, false);
        const includeMeta = parseBooleanQuery(req.query.includeMeta, true);
        const rawCategoryFilter = typeof req.query.category === 'string' ? req.query.category.trim() : '';
        const categoryFilter = rawCategoryFilter ? normalizeBlogCategory(rawCategoryFilter) : '';
        const { page, limit, offset } = parsePagination(req.query.page, req.query.limit, {
            defaultLimit: 12,
            maxLimit: 100,
        });

        if (!isAdmin) {
            const cacheKey = `${page}:${limit}:${summaryMode ? 'summary' : 'full'}:${includeMeta ? 'meta' : 'nometa'}:${categoryFilter || 'all'}`;
            const cachedPayload = getCachedPublicBlogs(cacheKey);
            if (cachedPayload) {
                res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
                return res.json(cachedPayload);
            }
        }

        const whereConditions: string[] = [];
        const whereParams: Array<string | number> = [];

        if (!isAdmin) {
            whereConditions.push('is_active = true');
        }
        if (categoryFilter) {
            whereParams.push(categoryFilter);
            whereConditions.push(`category = $${whereParams.length}`);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const selectContent = summaryMode ? 'LEFT(content, 450) AS content' : 'content';
        const limitParamIndex = whereParams.length + 1;
        const offsetParamIndex = whereParams.length + 2;
        const result = await pool.query(
            `SELECT id, title, ${selectContent}, image_url, is_active, created_at, category, excerpt, reading_time
             FROM blogs
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
            [...whereParams, limit, offset]
        );
        const payload: { items: any[]; meta?: ReturnType<typeof buildPaginationMeta> } = {
            items: result.rows,
        };

        if (includeMeta) {
            const countQuery = `SELECT COUNT(*)::int AS total FROM blogs ${whereClause}`;
            const totalResult = await pool.query(countQuery, whereParams);
            const total = Number(totalResult.rows[0]?.total || 0);
            payload.meta = buildPaginationMeta(total, page, limit);
        }

        if (!isAdmin) {
            const cacheKey = `${page}:${limit}:${summaryMode ? 'summary' : 'full'}:${includeMeta ? 'meta' : 'nometa'}:${categoryFilter || 'all'}`;
            setCachedPublicBlogs(cacheKey, payload);
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        }

        res.json(payload);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const createBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, image_url, is_active, category, excerpt, reading_time } = req.body;
        const normalizedCategory = normalizeBlogCategory(category);

        const result = await pool.query(
            'INSERT INTO blogs (title, content, image_url, is_active, category, excerpt, reading_time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, content, image_url, is_active || false, normalizedCategory, excerpt || '', reading_time || '5 min read']
        );

        clearPublicBlogsCache();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const updateBlog = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, image_url, is_active, category, excerpt, reading_time } = req.body;
        const normalizedCategory = normalizeBlogCategory(category);

        const result = await pool.query(
            'UPDATE blogs SET title = $1, content = $2, image_url = $3, is_active = $4, category = $5, excerpt = $6, reading_time = $7 WHERE id = $8 RETURNING *',
            [title, content, image_url, is_active, normalizedCategory, excerpt, reading_time, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        clearPublicBlogsCache();
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

        clearPublicBlogsCache();
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
