import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { sendExpirationNotification } from '../utils/emailService.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};

// Check for memberships expiring in specified days
const checkExpiringMemberships = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 CHECKING FOR EXPIRING MEMBERSHIPS');
  console.log('='.repeat(60));

  try {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    console.log(`📅 Current date: ${nowStr}`);
    
    // Days before expiration to check
    const daysToCheck = [10, 5, 1];
    
    let totalExpiringPayments = 0;
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    
    // Check for each day threshold
    for (const days of daysToCheck) {
      // Calculate the target date
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + days);
      
      // Format date for query and logging
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      console.log(`\n📅 Checking for memberships expiring in ${days} days (${targetDateStr})`);

      // Find payments with endDate matching the target date
      const expiringPayments = await Payment.find({
        paymentStatus: 'paid',
        endDate: {
          $gte: new Date(targetDateStr),
          $lt: new Date(new Date(targetDateStr).setDate(new Date(targetDateStr).getDate() + 1))
        }
      }).populate('userId', 'name email');

      console.log(`📋 Found ${expiringPayments.length} memberships expiring in ${days} days`);
      totalExpiringPayments += expiringPayments.length;

      // Send notifications
      let successCount = 0;
      let failureCount = 0;

      for (const payment of expiringPayments) {
        // Skip if no user or email
        if (!payment.userId || !payment.userId.email) {
          console.log(`⚠️ Skipping payment ${payment.orderId}: No user or email found`);
          continue;
        }

        const email = payment.userId.email;
        const name = payment.userId.name;
        
        console.log(`📧 Sending notification to ${name} <${email}> (${days} days remaining)`);
        
        // Send email notification with days remaining
        const emailSent = await sendExpirationNotification(email, days);
        
        if (emailSent) {
          console.log(`✅ Notification sent successfully to ${email}`);
          successCount++;
          totalSuccessCount++;
        } else {
          console.log(`❌ Failed to send notification to ${email}`);
          failureCount++;
          totalFailureCount++;
        }
      }
      
      console.log(`📊 ${days}-day notifications: ${successCount} sent, ${failureCount} failed`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 NOTIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📧 Total expiring memberships: ${totalExpiringPayments}`);
    console.log(`✅ Successful notifications: ${totalSuccessCount}`);
    console.log(`❌ Failed notifications: ${totalFailureCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error checking expiring memberships:', error);
  }
};

// Run as standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🚀 Running membership expiration check script...');
  
  connectDB().then(connected => {
    if (connected) {
      checkExpiringMemberships().then(() => {
        console.log('✅ Expiration check completed');
        mongoose.disconnect().then(() => {
          console.log('🔌 MongoDB disconnected');
          process.exit(0);
        });
      });
    } else {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
  });
}

// Export for use with cron
export const startCronJob = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🕛 Running scheduled membership expiration check...');
    await checkExpiringMemberships();
  });
  
  console.log('⏰ Cron job scheduled to run daily at midnight');
};

export { checkExpiringMemberships };