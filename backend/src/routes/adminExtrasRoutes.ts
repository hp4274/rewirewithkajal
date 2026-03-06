import express from 'express';
import {
    getCustomerPayments,
    addPayment,
    getTurnover,
    updateCustomerSettings,
    getCustomerNotes,
    addCustomerNote,
    getHistoricalForms,
    getHistoricalFormById,
    getCustomerSessions,
    updateSessionPresence
} from '../controllers/adminExtrasController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/customers/:id/payments')
    .get(protect, getCustomerPayments)
    .post(protect, addPayment);

router.route('/customers/:id/settings')
    .put(protect, updateCustomerSettings);

router.route('/customers/:id/notes')
    .get(protect, getCustomerNotes)
    .post(protect, addCustomerNote);

router.route('/customers/:id/sessions')
    .get(protect, getCustomerSessions);

router.route('/customers/:id/sessions/:sessionId/presence')
    .put(protect, updateSessionPresence);

router.route('/historical-forms')
    .get(protect, getHistoricalForms);

router.route('/historical-forms/:formId')
    .get(protect, getHistoricalFormById);

router.route('/turnover')
    .get(protect, getTurnover);

export default router;
