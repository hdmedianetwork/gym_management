import axios from 'axios';
import dotenv from 'dotenv';
import { fetchOrderDetails, fetchPaymentDetails, fetchAllTransactions, printTransactions, getTransactionSummary } from './fetchTransactions.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
dotenv.config();

// Cashfree configuration
const CF_ENV = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase(); // 'PROD' or 'SANDBOX'
const CF_APP_ID = process.env.CASHFREE_APP_ID;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY;
const CF_BASE_URL = CF_ENV === 'PROD' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';

// Validate required env vars at startup
if (!CF_APP_ID || !CF_SECRET) {
  console.warn('[Cashfree] Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY. Payments will fail until these are set.');
}

export const createPaymentSession = async (req, res) => {
  try {
  const { orderId, orderAmount, customerName, customerEmail, customerPhone, userId, planType, planAmount, planDuration, couponCode } = req.body;
    // Cashfree customer_id must be alphanumeric and may contain underscore or hyphens
    const customerId = (customerEmail || `guest_${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '_');

    // Guard: ensure credentials exist
    if (!CF_APP_ID || !CF_SECRET) {
      return res.status(500).json({ error: 'Cashfree credentials not configured' });
    }

    // Save payment record to database
    const paymentRecord = new Payment({
      orderId,
      userId,
      orderAmount,
      orderCurrency: 'INR',
      paymentStatus: 'initiated',
      customerDetails: {
        customerName,
        customerEmail,
        customerPhone
      },
      planType,
      planAmount,
      planDuration,
      couponCode: couponCode || null
    });

    await paymentRecord.save();
    console.log(`💾 Payment record saved for order: ${orderId}`);

    // Cashfree API endpoint
    const url = `${CF_BASE_URL}/pg/orders`;
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
        'x-client-id': CF_APP_ID,
        'x-client-secret': CF_SECRET,
        'Content-Type': 'application/json'
      }
    });

    // Update payment record with session ID
    await Payment.findOneAndUpdate(
      { orderId },
      { 
        paymentSessionId: response.data.payment_session_id,
        cashfreeData: response.data,
        // ensure we persist any plan metadata that might have been missing
        planAmount: paymentRecord.planAmount || planAmount,
        planDuration: paymentRecord.planDuration || planDuration,
        couponCode: paymentRecord.couponCode || couponCode || null
      }
    );

    // Return payment session id
    res.json({ paymentSessionId: response.data.payment_session_id, orderId: response.data.order_id });
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('Cashfree error:', data || error.message);
    // Provide clearer message for auth issues
    if (status === 401 || (typeof data === 'object' && (data?.message || '').toLowerCase().includes('authentication'))) {
      return res.status(500).json({ error: 'Cashfree authentication failed. Check CASHFREE_ENV, CASHFREE_APP_ID and CASHFREE_SECRET_KEY.' });
    }
    res.status(500).json({ error: data || error.message });
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

// 🚀 NEW: Fetch ALL transactions from database and print them
export const fetchAndPrintAllTransactions = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 FETCHING ALL TRANSACTIONS FROM DATABASE');
    console.log('='.repeat(60));
    
    // Get all payment records from database
    const paymentRecords = await Payment.find({})
      .populate('userId', 'name email mobile planType')
      .sort({ createdAt: -1 }); // Latest first
    
    if (paymentRecords.length === 0) {
      console.log('❌ No payment records found in database.');
      return res.json({
        success: true,
        message: 'No payment records found in database',
        transactions: [],
        summary: { total: 0, successful: 0, failed: 0, pending: 0, totalAmount: 0 }
      });
    }
    
    console.log(`📦 Found ${paymentRecords.length} payment records in database`);
    
    // Extract order IDs
    const orderIds = paymentRecords.map(payment => payment.orderId);
    console.log('📋 Order IDs:', orderIds.slice(0, 5), orderIds.length > 5 ? `... and ${orderIds.length - 5} more` : '');
    
    console.log('\n🌐 Fetching transaction details from Cashfree...');
    
    // Fetch transactions from Cashfree
    const cashfreeTransactions = await fetchAllTransactions(orderIds);
    
    // Combine database records with Cashfree data
    const enhancedTransactions = cashfreeTransactions.map(transaction => {
      const dbRecord = paymentRecords.find(record => record.orderId === transaction.orderId);
      return {
        ...transaction,
        // Expose key plan metadata at the top level for frontend consumption
        planType: dbRecord?.planType ?? transaction.planType,
        planAmount: dbRecord?.planAmount ?? transaction.planAmount,
        planDuration: dbRecord?.planDuration ?? transaction.planDuration,
        couponCode: dbRecord?.couponCode, // Add couponCode to the transaction
        databaseInfo: dbRecord ? {
          userId: dbRecord.userId,
          planType: dbRecord.planType,
          planAmount: dbRecord.planAmount,
          planDuration: dbRecord.planDuration,
          createdInDb: dbRecord.createdAt,
          paymentStatus: dbRecord.paymentStatus
        } : null
      };
    });
    
    // Print detailed transactions to console
    printTransactions(enhancedTransactions);
    
    // Print database summary
    console.log('\n' + '='.repeat(60));
    console.log('💾 DATABASE RECORDS SUMMARY');
    console.log('='.repeat(60));
    
    const dbSummary = paymentRecords.reduce((acc, record) => {
      acc.total += 1;
      switch (record.paymentStatus) {
        case 'paid':
          acc.paid += 1;
          acc.totalAmount += record.orderAmount;
          break;
        case 'failed':
          acc.failed += 1;
          break;
        case 'pending':
        case 'active':
          acc.pending += 1;
          break;
        case 'initiated':
          acc.initiated += 1;
          break;
      }
      return acc;
    }, { total: 0, paid: 0, failed: 0, pending: 0, initiated: 0, totalAmount: 0 });
    
    console.log(`📊 Total Records: ${dbSummary.total}`);
    console.log(`✅ Paid: ${dbSummary.paid}`);
    console.log(`❌ Failed: ${dbSummary.failed}`);
    console.log(`⏳ Pending: ${dbSummary.pending}`);
    console.log(`🔄 Initiated: ${dbSummary.initiated}`);
    console.log(`💰 Total Amount (Paid): ₹${dbSummary.totalAmount.toFixed(2)}`);
    
    // Print Cashfree summary
    const cashfreeSummary = getTransactionSummary(enhancedTransactions);
    console.log('\n' + '='.repeat(60));
    console.log('🌐 CASHFREE TRANSACTIONS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📈 Total Transactions: ${cashfreeSummary.total}`);
    console.log(`✅ Successful: ${cashfreeSummary.successful}`);
    console.log(`❌ Failed: ${cashfreeSummary.failed}`);
    console.log(`⏳ Pending: ${cashfreeSummary.pending}`);
    console.log(`💰 Total Successful Amount: ₹${cashfreeSummary.totalAmount.toFixed(2)}`);
    console.log('='.repeat(60));
    
    res.json({
      success: true,
      message: 'All transactions fetched and printed to console',
      databaseRecords: paymentRecords.length,
      cashfreeTransactions: enhancedTransactions.length,
      databaseSummary: dbSummary,
      cashfreeSummary: cashfreeSummary,
      transactions: enhancedTransactions
    });
    
  } catch (error) {
    console.error('❌ Error fetching all transactions:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Print saved payments from our database (safe, does not call Cashfree)
export const printSavedPayments = async (req, res) => {
  try {
    const paymentRecords = await Payment.find({}).populate('userId', 'name email mobile').sort({ createdAt: -1 });

    if (!paymentRecords || paymentRecords.length === 0) {
      console.log('No saved payments found in database.');
      return res.json({ success: true, message: 'No saved payments found', payments: [] });
    }

    console.log('\n' + '='.repeat(60));
    console.log('💾 SAVED PAYMENTS FROM DATABASE');
    console.log('='.repeat(60));

    const output = paymentRecords.map(p => {
      const name = p.customerDetails?.customerName || p.userId?.name || 'N/A';
      const email = p.customerDetails?.customerEmail || p.userId?.email || 'N/A';
      const amount = p.orderAmount || p.planAmount || 0;
      const ts = p.paymentCompletedAt || p.updatedAt || p.createdAt;
      const date = ts ? new Date(ts).toISOString() : null;
      console.log(`👤 ${name} <${email}> — ₹${amount} — ${date}`);
      return {
        orderId: p.orderId,
        name,
        email,
        amount,
        date,
        planType: p.planType || null,
        planAmount: p.planAmount || null,
        planDuration: p.planDuration || null,
        paymentStatus: p.paymentStatus
      };
    });

    console.log('='.repeat(60) + '\n');

    res.json({ success: true, count: paymentRecords.length, payments: output });
  } catch (error) {
    console.error('Error printing saved payments:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Print only successful/paid payments from our database
export const printPaidPayments = async (req, res) => {
  try {
    // Find payments marked as paid or with a completed timestamp
    const paymentRecords = await Payment.find({
      $or: [
        { paymentStatus: { $regex: /^paid$/i } },
        { paymentCompletedAt: { $exists: true, $ne: null } }
      ]
    }).populate('userId', 'name email mobile').sort({ paymentCompletedAt: -1, createdAt: -1 });

    if (!paymentRecords || paymentRecords.length === 0) {
      console.log('No paid payments found in database.');
      return res.json({ success: true, message: 'No paid payments found', payments: [] });
    }

    console.log('\n' + '='.repeat(60));
    console.log('💸 PAID PAYMENTS FROM DATABASE');
    console.log('='.repeat(60));

    const output = paymentRecords.map(p => {
      const name = p.customerDetails?.customerName || p.userId?.name || 'N/A';
      const email = p.customerDetails?.customerEmail || p.userId?.email || 'N/A';
      const amount = p.orderAmount || p.planAmount || 0;
      const ts = p.paymentCompletedAt || p.updatedAt || p.createdAt;
      const date = ts ? new Date(ts).toISOString() : null;
      const human = ts ? new Date(ts).toLocaleString('en-IN') : 'N/A';
      console.log(`👤 ${name} <${email}> — ₹${amount} — ${human}`);
      return {
        orderId: p.orderId,
        name,
        email,
        amount,
        date,
        humanDate: human,
        planType: p.planType || null,
        planAmount: p.planAmount || null,
        planDuration: p.planDuration || null,
        paymentStatus: p.paymentStatus
      };
    });

    console.log('='.repeat(60) + '\n');

    res.json({ success: true, count: paymentRecords.length, payments: output });
  } catch (error) {
    console.error('Error printing paid payments:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🚀 NEW: Sync user data based on successful payments
export const syncUserDataWithPayments = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 SYNCING USER DATA WITH PAYMENT STATUS');
    console.log('='.repeat(60));
    
    // Get all payment records from database
    const paymentRecords = await Payment.find({})
      .populate('userId', 'name email mobile planType accountStatus paymentStatus')
      .sort({ createdAt: -1 });
    
    if (paymentRecords.length === 0) {
      console.log('❌ No payment records found in database.');
      return res.json({
        success: true,
        message: 'No payment records found in database',
        updatedUsers: []
      });
    }
    
    console.log(`📦 Found ${paymentRecords.length} payment records in database`);
    
    // Extract order IDs
    const orderIds = paymentRecords.map(payment => payment.orderId);
    console.log('🌐 Fetching latest payment status from Cashfree...');
    
    // Fetch transactions from Cashfree
    const cashfreeTransactions = await fetchAllTransactions(orderIds);
    
    const updatedUsers = [];
    const updateLog = [];
    
    // Process each transaction
    for (const transaction of cashfreeTransactions) {
      const dbPayment = paymentRecords.find(record => record.orderId === transaction.orderId);
      
      const orderStatus = transaction.orderStatus?.toLowerCase();
      const isSuccessfulPayment = orderStatus === 'paid' || orderStatus === 'success';
      
      if (isSuccessfulPayment) {
        console.log(`\n✅ Processing successful payment: ${transaction.orderId}`);
        
        let user = null;
        
        // First try to find user by userId from payment record
        if (dbPayment && dbPayment.userId) {
          user = await User.findById(dbPayment.userId);
          console.log(`   🔍 Found user by payment record linkage: ${user?.name || 'None'}`);
        }
        
        // If not found, try to find user by email from transaction
        if (!user && transaction.customerDetails?.customer_email) {
          const customerEmail = transaction.customerDetails.customer_email.toLowerCase().trim();
          console.log(`   📧 Trying to find user by email: ${customerEmail}`);
          
          // Debug: show all users in system for comparison
          const allUsers = await User.find({}, 'name email').limit(10);
          console.log(`   📊 Available users (first 10):`);
          allUsers.forEach(u => console.log(`      - ${u.name} (${u.email})`));
          
          user = await User.findOne({ email: customerEmail });
          console.log(`   🎯 Result: ${user ? `Found ${user.name}` : 'No match found'}`);
        }
        
        if (!user) {
          console.log(`❌ User not found for payment ${transaction.orderId} (tried userId and email match)`);
          continue;
        }
        // If the user was manually suspended or terminated, skip automatic sync to avoid overwriting manual changes
        const manualStatuses = ['suspended', 'terminated'];
        if (user.accountStatus && manualStatuses.includes(String(user.accountStatus).toLowerCase())) {
          console.log(`🔒 Skipping user ${user.email} because accountStatus is manual: ${user.accountStatus}`);
          continue;
        }
        
        const updates = {};
        const changes = [];
        
        // Check and update account status
        if (user.accountStatus !== 'active') {
          updates.accountStatus = 'active';
          changes.push(`Account Status: ${user.accountStatus} → active`);
        }
        
        // Check and update plan type based on payment amount
        const amount = parseFloat(transaction.orderAmount);
        let newPlanType = user.planType;
        
        if (dbPayment.planType && dbPayment.planType !== 'no plan') {
          newPlanType = dbPayment.planType;
        } else {
          // Determine plan type based on amount (you can adjust these ranges)
          if (amount >= 5000) {
            newPlanType = 'premium';
          } else if (amount >= 3000) {
            newPlanType = 'standard';
          } else if (amount >= 1000) {
            newPlanType = 'basic';
          }
        }
        
        if (user.planType !== newPlanType) {
          updates.planType = newPlanType;
          changes.push(`Plan Type: ${user.planType} → ${newPlanType}`);
        }
        
        // Check and update payment status
        if (user.paymentStatus !== 'paid') {
          updates.paymentStatus = 'paid';
          changes.push(`Payment Status: ${user.paymentStatus} → paid`);
        }
        
        // Update user if there are changes
        if (Object.keys(updates).length > 0) {
          await User.findByIdAndUpdate(user._id, updates);
          
          const userUpdate = {
            userId: user._id,
            name: user.name,
            email: user.email,
            orderId: transaction.orderId,
            amount: transaction.orderAmount,
            changes: changes
          };
          
          updatedUsers.push(userUpdate);
          updateLog.push(`👤 ${user.name} (${user.email}): ${changes.join(', ')}`);
          
          console.log(`✅ Updated user: ${user.name}`);
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   🔄 Changes: ${changes.join(', ')}`);
        } else {
          console.log(`ℹ️  User ${user.name} already up to date`);
        }
        
        // Also update the payment record status in our payments collection
        await Payment.findOneAndUpdate(
          { orderId: transaction.orderId },
          { 
            paymentStatus: 'paid',
            paymentCompletedAt: new Date()
          }
        );
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`📝 Total Payments Processed: ${cashfreeTransactions.length}`);
    console.log(`✅ Users Updated: ${updatedUsers.length}`);
    console.log('\n📋 Update Log:');
    updateLog.forEach(log => console.log(log));
    console.log('='.repeat(60));
    
    res.json({
      success: true,
      message: 'User data synced with payment status',
      totalPayments: cashfreeTransactions.length,
      updatedUsers: updatedUsers,
      updateLog: updateLog
    });
    
  } catch (error) {
    console.error('❌ Error syncing user data:', error.message);
    res.status(500).json({ error: error.message });
  }
};
