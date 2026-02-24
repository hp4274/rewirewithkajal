import express from 'express';
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../controllers/blogController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getBlogs); // Protected for admin so they can see all blogs

router.get('/public', getBlogs);

router.route('/')
    .post(protect, createBlog);

router.route('/:id')
    .put(protect, updateBlog)
    .delete(protect, deleteBlog);

export default router;
