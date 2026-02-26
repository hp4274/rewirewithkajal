import express from 'express';
import { loginAdmin, registerAdmin, sendOtp } from '../controllers/authController';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/login', loginAdmin);
router.post('/register', registerAdmin); // Ideally this is protected or used once

export default router;
