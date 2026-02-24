import express from 'express';
import { createLead, getLeads, acceptLead, deleteLead } from '../controllers/leadController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(createLead)
    .get(protect, getLeads);

router.route('/:id/accept')
    .put(protect, acceptLead);

router.route('/:id')
    .delete(protect, deleteLead);

export default router;
