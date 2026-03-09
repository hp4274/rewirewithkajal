import express from 'express';
import multer from 'multer';
import { getBlogs, createBlog, updateBlog, deleteBlog, uploadBlogImage, getBlogImage } from '../controllers/blogController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = express.Router();

router.route('/')
    .get(protect, getBlogs); // Protected for admin so they can see all blogs

router.get('/public', getBlogs);
router.get('/image/:filename', getBlogImage);

router.post('/upload', protect, (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Multer Error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message || 'Unknown upload error' });
        }
        next();
    });
}, uploadBlogImage);

router.route('/')
    .post(protect, createBlog);

router.route('/:id')
    .put(protect, updateBlog)
    .delete(protect, deleteBlog);

export default router;
