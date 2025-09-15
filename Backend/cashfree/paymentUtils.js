import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const calculateEndDate = (planDuration) => {
  if (!planDuration) return null;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + planDuration);
  return endDate;
};

export const updateUserAfterPayment = async (userId, payment) => {
  if (!userId) return;
  
  const updateData = {
    paymentStatus: 'paid',
    planType: payment.planType,
    planStartDate: new Date(),
    planEndDate: calculateEndDate(payment.planDuration),
    accountStatus: 'active'
  };
  
  await User.findByIdAndUpdate(userId, updateData);
};

export const verifyWebhookSignature = (signature, payload, secret) => {
  // Implement webhook signature verification
  // This is a placeholder - implement according to Cashfree's documentation
  return true; // For development, always return true. In production, implement proper verification
};
