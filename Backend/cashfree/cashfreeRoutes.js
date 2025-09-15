import express from 'express';
import { createPaymentSession, getAllTransactions, getOrderDetails, printAllTransactions, fetchAndPrintAllTransactions, syncUserDataWithPayments, printSavedPayments, printPaidPayments } from './cashfreeController.js';
import { handlePaymentWebhook } from './webhookHandler.js';

const router = express.Router();

// Payment session creation
router.post('/create-session', createPaymentSession);

// Transaction fetching endpoints
router.post('/transactions', getAllTransactions);
router.get('/order/:orderId', getOrderDetails);
router.post('/print-transactions', printAllTransactions);

// Print payments saved in our DB (no external calls)
router.get('/saved', printSavedPayments);

// Print only paid payments (name, email, amount, date) from DB
router.get('/paid', printPaidPayments);

// 🚀 NEW: Fetch ALL transactions from database (no input needed)
router.get('/all-transactions', fetchAndPrintAllTransactions);

// 🚀 NEW: Sync user data with payment status
router.post('/sync-users', syncUserDataWithPayments);

// Webhook endpoint for Cashfree payment updates
router.post('/webhook', handlePaymentWebhook);

export default router;
