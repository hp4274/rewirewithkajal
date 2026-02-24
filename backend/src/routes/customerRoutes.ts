import express from 'express';
import {
    getCustomers,
    getCustomerByToken,
    submitHiddenForm,
    submitPublicForm,
    updateCustomerStatus
} from '../controllers/customerController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getCustomers)
    .post(submitPublicForm);

router.route('/token/:token')
    .get(getCustomerByToken)
    .post(submitHiddenForm);

router.route('/:id/status')
    .put(protect, updateCustomerStatus);

export default router;
