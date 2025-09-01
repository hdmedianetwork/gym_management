import express from 'express';
import { createPaymentSession, getAllTransactions, getOrderDetails, printAllTransactions, fetchAndPrintAllTransactions, syncUserDataWithPayments } from './cashfreeController.js';

const router = express.Router();

// Payment session creation
router.post('/create-session', createPaymentSession);

// Transaction fetching endpoints
router.post('/transactions', getAllTransactions);
router.get('/order/:orderId', getOrderDetails);
router.post('/print-transactions', printAllTransactions);

// 🚀 NEW: Fetch ALL transactions from database (no input needed)
router.get('/all-transactions', fetchAndPrintAllTransactions);

// 🚀 NEW: Sync user data with payment status
router.post('/sync-users', syncUserDataWithPayments);

export default router;
