import Payment from '../models/Payment.js';
import { verifyWebhookSignature, updateUserAfterPayment } from './paymentUtils.js';

export const handlePaymentWebhook = async (req, res) => {
  try {
    const { data } = req.body;
    const signature = req.headers['x-webhook-signature'];
    
    // Verify webhook signature (use your Cashfree webhook secret)
    const isValid = verifyWebhookSignature(
      signature,
      req.body,
      process.env.CASHFREE_WEBHOOK_SECRET
    );
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const orderId = data.order?.order_id;
    if (!orderId) {
      console.error('No order ID in webhook payload');
      return res.status(400).json({ error: 'No order ID provided' });
    }
    
    const paymentStatus = data.payment?.payment_status?.toLowerCase();
    if (!paymentStatus) {
      console.error('No payment status in webhook payload');
      return res.status(400).json({ error: 'No payment status provided' });
    }
    
    // Update payment record
    const updateData = {
      paymentStatus,
      $push: {
        attempts: {
          status: paymentStatus,
          response: data,
          timestamp: new Date()
        }
      }
    };
    
    if (['success', 'paid'].includes(paymentStatus)) {
      updateData.paymentCompletedAt = new Date();
    }
    
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );
    
    if (!payment) {
      console.error(`Payment not found for order ID: ${orderId}`);
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Update user status if payment is successful
    if (['success', 'paid'].includes(paymentStatus) && payment.userId) {
      await updateUserAfterPayment(payment.userId, payment);
    }
    
    console.log(`Updated payment status for order ${orderId} to ${paymentStatus}`);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
};
