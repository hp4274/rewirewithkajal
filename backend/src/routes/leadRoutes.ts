import express from 'express';
import { createLead, getLeadAvailability, getLeads, acceptLead, rejectLead, deleteLead } from '../controllers/leadController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/availability', getLeadAvailability);

router.route('/')
    .post(createLead)
    .get(protect, getLeads);

router.route('/:id/accept')
    .put(protect, acceptLead);

router.route('/:id/reject')
    .put(protect, rejectLead);

router.route('/:id')
    .delete(protect, deleteLead);

export default router;
