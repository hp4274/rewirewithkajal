import express from 'express';
import { loginAdmin, registerAdmin } from '../controllers/authController';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/register', registerAdmin); // Ideally this is protected or used once

export default router;
