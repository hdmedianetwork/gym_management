import Payment from '../models/Payment.js';
import { fetchOrderDetails } from '../cashfree/fetchTransactions.js';
import { updateUserAfterPayment } from '../cashfree/paymentUtils.js';

export const syncPaymentStatuses = async () => {
  try {
    console.log('Starting payment status sync...');
    
    // Find payments that are still in 'initiated' state from the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const payments = await Payment.find({ 
      paymentStatus: 'initiated',
      createdAt: { $gte: oneWeekAgo }
    });

    console.log(`Found ${payments.length} payments to sync`);
    
    for (const payment of payments) {
      try {
        console.log(`Syncing payment ${payment.orderId}...`);
        const orderDetails = await fetchOrderDetails(payment.orderId);
        
        if (!orderDetails) {
          console.log(`No order details found for ${payment.orderId}`);
          continue;
        }
        
        const paymentStatus = orderDetails.payment_status?.toLowerCase() || 
                            orderDetails.order_status?.toLowerCase();
        
        if (!paymentStatus) {
          console.log(`No status found for order ${payment.orderId}`);
          continue;
        }
        
        // Only update if status has changed
        if (paymentStatus !== payment.paymentStatus) {
          const updateData = {
            paymentStatus,
            $push: {
              attempts: {
                status: paymentStatus,
                response: orderDetails,
                timestamp: new Date()
              }
            }
          };
          
          if (['success', 'paid'].includes(paymentStatus)) {
            updateData.paymentCompletedAt = new Date();
          }
          
          const updatedPayment = await Payment.findByIdAndUpdate(
            payment._id,
            updateData,
            { new: true }
          );
          
          // Update user status if payment is successful
          if (['success', 'paid'].includes(paymentStatus) && updatedPayment.userId) {
            await updateUserAfterPayment(updatedPayment.userId, updatedPayment);
          }
          
          console.log(`Updated payment ${payment.orderId} to ${paymentStatus}`);
        } else {
          console.log(`No status change for ${payment.orderId}`);
        }
        
      } catch (error) {
        console.error(`Error syncing payment ${payment.orderId}:`, error.message);
      }
      
      // Add a small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Payment status sync completed');
    return { success: true, synced: payments.length };
    
  } catch (error) {
    console.error('Error in syncPaymentStatuses:', error);
    throw error;
  }
};

// For manual execution
if (process.argv.includes('--run')) {
  syncPaymentStatuses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
