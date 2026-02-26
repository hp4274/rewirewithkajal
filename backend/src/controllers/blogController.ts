import { Request, Response } from 'express';
import pool from '../db';

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
        console.log("Upload request received. File:", req.file);

        if (!req.file) {
            console.log("No file was found in req.file");
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Return the path relative to the domain (e.g., /uploads/filename.jpg)
        const imageUrl = `/uploads/${req.file.filename}`;
        console.log("Upload successful, URL:", imageUrl);

        res.status(200).json({ image_url: imageUrl });
    } catch (error) {
        console.error("Upload error details:", error);
        res.status(500).json({ message: 'Image upload failed', error });
    }
};
