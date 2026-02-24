import express from 'express';
import {
    getCustomerPayments,
    addPayment,
    updateCustomerSettings,
    getCustomerNotes,
    addCustomerNote,
    getHistoricalForms,
    getHistoricalFormById
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

router.route('/historical-forms')
    .get(protect, getHistoricalForms);

router.route('/historical-forms/:formId')
    .get(protect, getHistoricalFormById);

export default router;
