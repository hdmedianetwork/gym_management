import express from "express";
import { sendExpirationNotification } from "../utils/emailService.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";

const router = express.Router();

// Route to send membership expiration notification to a single user
router.get("/expiration-notice", async (req, res) => {
  try {
    const { email } = req.query;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Send notification email
    const emailSent = await sendExpirationNotification(email);
    
    if (emailSent) {
      return res.json({ 
        success: true, 
        message: "Expiration notification sent successfully" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to send expiration notification" 
      });
    }
  } catch (error) {
    console.error("Error sending expiration notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate days remaining until membership expiration
const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null;
  
  const today = new Date();
  const expiryDate = new Date(endDate);
  
  // Reset time part to compare dates only
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Helper function to calculate end date based on payment data and plan
const calculateEndDate = async (user, payment) => {
  // If payment has endDate, use it
  if (payment && payment.endDate) {
    return payment.endDate;
  }
  
  // Get all plans from database
  const plans = await Plan.find({});
  
  // Get payment date
  let paymentDate = payment ? payment.createdAt : user.createdAt;
  if (!paymentDate) return null;
  
  // Get plan type and duration
  let planType = payment ? payment.planType : user.planType;
  if (!planType || planType === 'no plan') return null;
  
  // Find matching plan
  const plan = plans.find(p => 
    p.planType.toLowerCase() === planType.toLowerCase() ||
    p.planType.toLowerCase() === planType.toLowerCase().replace(' plan', '')
  );
  
  if (!plan || !plan.duration) return null;
  
  // Calculate end date
  const startDate = new Date(paymentDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.duration);
  
  return endDate;
};

// Route to send membership expiration notification to all users
router.get("/notify-all-expiring", async (req, res) => {
  // Get test days parameter for testing specific expiration scenarios
  const testDays = req.query.testDays ? parseInt(req.query.testDays) : null;
  try {
    // Get all active users
    const users = await User.find({ 
      accountStatus: 'active',
      paymentStatus: 'paid'
    });
    
    // Get all payments
    const payments = await Payment.find({ paymentStatus: 'paid' });
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process each user
    for (const user of users) {
      // Find payment for this user
      const userPayment = payments.find(p => 
        p.userId && p.userId.toString() === user._id.toString()
      );
      
      // Calculate end date
      const endDate = await calculateEndDate(user, userPayment);
      
      // Calculate days remaining
      // Use testDays parameter if provided, otherwise calculate from endDate
      const daysRemaining = testDays !== null ? testDays : calculateDaysRemaining(endDate);
      
      // Skip users with no end date or expired memberships
      // Only check if testDays is not provided
      if (testDays === null && (daysRemaining === null || daysRemaining < 0)) {
        results.push({
          email: user.email,
          name: user.name,
          daysRemaining,
          status: 'skipped',
          reason: daysRemaining === null ? 'No end date found' : 'Membership already expired'
        });
        continue;
      }
      
      // Send notification email with days remaining
      const emailSent = await sendExpirationNotification(user.email, daysRemaining);
      
      if (emailSent) {
        successCount++;
        results.push({
          email: user.email,
          name: user.name,
          daysRemaining,
          status: 'success'
        });
      } else {
        failureCount++;
        results.push({
          email: user.email,
          name: user.name,
          daysRemaining,
          status: 'failed'
        });
      }
    }
    
    return res.json({
      success: true,
      totalUsers: users.length,
      successCount,
      failureCount,
      skippedCount: users.length - (successCount + failureCount),
      results
    });
  } catch (error) {
    console.error("Error sending notifications to all users:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;