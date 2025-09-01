import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Function to fetch specific order details
export const fetchOrderDetails = async (orderId) => {
  try {
    const url = `https://sandbox.cashfree.com/pg/orders/${orderId}`;
    
    const response = await axios.get(url, {
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to fetch payment details for a specific order
export const fetchPaymentDetails = async (orderId) => {
  try {
    const url = `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`;
    
    const response = await axios.get(url, {
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching payment details:', error.response?.data || error.message);
    throw error;
  }
};

// Function to fetch all transactions (this requires order IDs)
export const fetchAllTransactions = async (orderIds) => {
  try {
    const transactions = [];
    
    for (const orderId of orderIds) {
      try {
        // Fetch order details
        const orderDetails = await fetchOrderDetails(orderId);
        
        // Fetch payment details for this order
        const paymentDetails = await fetchPaymentDetails(orderId);
        
        // Combine order and payment information
        const transactionInfo = {
          orderId: orderDetails.order_id,
          orderAmount: orderDetails.order_amount,
          orderStatus: orderDetails.order_status,
          orderCurrency: orderDetails.order_currency,
          customerDetails: orderDetails.customer_details,
          createdAt: orderDetails.created_at,
          paymentDetails: paymentDetails
        };
        
        transactions.push(transactionInfo);
      } catch (error) {
        console.error(`Error fetching details for order ${orderId}:`, error.message);
        // Continue with other orders even if one fails
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching all transactions:', error.message);
    throw error;
  }
};

// Function to print transactions in a formatted way
export const printTransactions = (transactions) => {
  console.log('\n=== CASHFREE TRANSACTIONS ===\n');
  
  if (!transactions || transactions.length === 0) {
    console.log('No transactions found.');
    return;
  }
  
  transactions.forEach((transaction, index) => {
    console.log(`--- Transaction ${index + 1} ---`);
    console.log(`Order ID: ${transaction.orderId}`);
    console.log(`Amount: ₹${transaction.orderAmount} ${transaction.orderCurrency}`);
    console.log(`Status: ${transaction.orderStatus}`);
    console.log(`Customer: ${transaction.customerDetails?.customer_name || 'N/A'}`);
    console.log(`Email: ${transaction.customerDetails?.customer_email || 'N/A'}`);
    console.log(`Phone: ${transaction.customerDetails?.customer_phone || 'N/A'}`);
    console.log(`Created: ${new Date(transaction.createdAt).toLocaleString()}`);
    
    // Print payment details
    if (transaction.paymentDetails && transaction.paymentDetails.length > 0) {
      console.log('Payment Details:');
      transaction.paymentDetails.forEach((payment, paymentIndex) => {
        console.log(`  Payment ${paymentIndex + 1}:`);
        console.log(`    Payment ID: ${payment.cf_payment_id}`);
        console.log(`    Payment Status: ${payment.payment_status}`);
        console.log(`    Payment Method: ${payment.payment_group || 'N/A'}`);
        console.log(`    Payment Amount: ₹${payment.payment_amount || 'N/A'}`);
        console.log(`    Payment Time: ${payment.payment_time ? new Date(payment.payment_time).toLocaleString() : 'N/A'}`);
      });
    } else {
      console.log('Payment Details: No payments found');
    }
    
    console.log(''); // Empty line for spacing
  });
  
  console.log(`=== Total Transactions: ${transactions.length} ===\n`);
};

// Function to get transaction summary
export const getTransactionSummary = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      totalAmount: 0
    };
  }
  
  const summary = transactions.reduce((acc, transaction) => {
    acc.total += 1;
    
    switch (transaction.orderStatus?.toLowerCase()) {
      case 'paid':
      case 'success':
        acc.successful += 1;
        acc.totalAmount += parseFloat(transaction.orderAmount || 0);
        break;
      case 'failed':
      case 'cancelled':
        acc.failed += 1;
        break;
      case 'active':
      case 'pending':
        acc.pending += 1;
        break;
    }
    
    return acc;
  }, {
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0
  });
  
  return summary;
};

// Example usage function
export const exampleFetchAndPrint = async () => {
  try {
    // Example: Replace these with actual order IDs from your database
    const exampleOrderIds = ['order_1756717099673', 'order_1756717099673'];
    
    console.log('Fetching transactions from Cashfree...');
    const transactions = await fetchAllTransactions(exampleOrderIds);
    
    // Print detailed transactions
    printTransactions(transactions);
    
    // Print summary
    const summary = getTransactionSummary(transactions);
    console.log('=== SUMMARY ===');
    console.log(`Total Transactions: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Pending: ${summary.pending}`);
    console.log(`Total Amount (Successful): ₹${summary.totalAmount}`);
    
    return transactions;
  } catch (error) {
    console.error('Error in example fetch:', error.message);
  }
};
