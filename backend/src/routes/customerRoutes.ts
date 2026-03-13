import express from 'express';
import {
    getCustomerAvailability,
    getCustomers,
    getCustomerByToken,
    submitHiddenForm,
    submitPublicForm,
    updateCustomerStatus,
    updateCustomerAppointment,
    getCustomerForms
} from '../controllers/customerController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/availability', getCustomerAvailability);

router.route('/')
    .get(protect, getCustomers)
    .post(submitPublicForm);

router.route('/token/:token')
    .get(getCustomerByToken)
    .post(submitHiddenForm);

router.route('/:id/forms')
    .get(protect, getCustomerForms);

router.route('/:id/status')
    .put(protect, updateCustomerStatus);

router.route('/:id/appointment')
    .put(protect, updateCustomerAppointment);

export default router;
