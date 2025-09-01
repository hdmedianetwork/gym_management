import express from 'express';
import { createPaymentSession, getAllTransactions, getOrderDetails, printAllTransactions } from './cashfreeController.js';

const router = express.Router();

// Payment session creation
router.post('/create-session', createPaymentSession);

// Transaction fetching endpoints
router.post('/transactions', getAllTransactions);
router.get('/order/:orderId', getOrderDetails);
router.post('/print-transactions', printAllTransactions);

export default router;
