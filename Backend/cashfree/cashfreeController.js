import axios from 'axios';
import dotenv from 'dotenv';
import { fetchOrderDetails, fetchPaymentDetails, fetchAllTransactions, printTransactions, getTransactionSummary } from './fetchTransactions.js';
dotenv.config();

export const createPaymentSession = async (req, res) => {
  try {
    const { orderId, orderAmount, customerName, customerEmail, customerPhone } = req.body;
    // Cashfree customer_id must be alphanumeric and may contain underscore or hyphens
    const customerId = (customerEmail || `guest_${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '_');
    // Cashfree API endpoint
    const url = 'https://sandbox.cashfree.com/pg/orders';
    // Prepare payload
    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: req.body.returnUrl || 'https://yourdomain.com/payment-success'
      }
    };
    // Make request to Cashfree
    const response = await axios.post(url, payload, {
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    // Return payment session id
    res.json({ paymentSessionId: response.data.payment_session_id, orderId: response.data.order_id });
  } catch (error) {
    console.error('Cashfree error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Controller to fetch and display all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const { orderIds } = req.body; // Expecting an array of order IDs
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of order IDs' });
    }
    
    console.log('Fetching transactions for order IDs:', orderIds);
    
    const transactions = await fetchAllTransactions(orderIds);
    
    // Print transactions to console
    printTransactions(transactions);
    
    // Get summary
    const summary = getTransactionSummary(transactions);
    
    res.json({
      success: true,
      transactions: transactions,
      summary: summary
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Controller to fetch single order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    console.log('Fetching details for order:', orderId);
    
    const orderDetails = await fetchOrderDetails(orderId);
    const paymentDetails = await fetchPaymentDetails(orderId);
    
    const result = {
      orderDetails,
      paymentDetails
    };
    
    // Print to console
    console.log('\n=== ORDER DETAILS ===');
    console.log(JSON.stringify(result, null, 2));
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Controller to print all transactions from database order IDs
export const printAllTransactions = async (req, res) => {
  try {
    // You'll need to replace this with actual logic to get order IDs from your database
    // For now, this is a placeholder
    const orderIds = req.body.orderIds || [];
    
    if (orderIds.length === 0) {
      console.log('No order IDs provided. Please provide order IDs to fetch transactions.');
      return res.json({ message: 'No order IDs provided' });
    }
    
    console.log('\n=== FETCHING ALL TRANSACTIONS ===');
    const transactions = await fetchAllTransactions(orderIds);
    
    // Print detailed transactions to console
    printTransactions(transactions);
    
    // Print summary
    const summary = getTransactionSummary(transactions);
    console.log('\n=== TRANSACTION SUMMARY ===');
    console.log(`Total Transactions: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Pending: ${summary.pending}`);
    console.log(`Total Successful Amount: ₹${summary.totalAmount}`);
    
    res.json({
      success: true,
      message: 'Transactions printed to console',
      summary: summary
    });
    
  } catch (error) {
    console.error('Error printing transactions:', error.message);
    res.status(500).json({ error: error.message });
  }
};
