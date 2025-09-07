import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
    // console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    // console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};

// Test sending expiration notification to a specific email
const testExpirationNotification = async (email, days = null) => {
  if (!email) {
    // console.error('❌ Email is required');
    return false;
  }

  const daysText = days !== null ? ` (${days} days remaining)` : '';
  // console.log(`📧 Sending test expiration notification to ${email}${daysText}`);
  
  try {
    const emailSent = await sendExpirationNotification(email, days);
    
    if (emailSent) {
      // console.log(`✅ Test notification sent successfully to ${email}${daysText}`);
      return true;
    } else {
      // console.log(`❌ Failed to send test notification to ${email}`);
      return false;
    }
  } catch (error) {
    // console.error('❌ Error sending test notification:', error);
    return false;
  }
};

// Find users with active memberships and send test notifications
const findAndNotifyUsers = async (days = null) => {
  try {
    // Find active users
    const activeUsers = await User.find({ accountStatus: 'active', paymentStatus: 'paid' }).limit(5);
    
    // console.log(`📋 Found ${activeUsers.length} active users`);
    
    if (activeUsers.length === 0) {
      // console.log('❌ No active users found');
      return;
    }
    
    const daysText = days !== null ? ` with ${days} days remaining` : '';
    // console.log(`📧 Sending test notifications${daysText} to active users`);
    
    // Send test notifications
    for (const user of activeUsers) {
      await testExpirationNotification(user.email, days);
    }
  } catch (error) {
    // console.error('❌ Error finding and notifying users:', error);
  }
};

// Parse command line arguments
const processArgs = () => {
  const args = process.argv.slice(2);
  const result = { mode: 'find', days: null }; // Default mode: find users and send notifications
  
  if (args.length === 0) {
    return result;
  }
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      result.mode = 'email';
      result.email = args[i + 1];
      i++; // Skip the next argument as we've already processed it
    } else if (args[i] === '--days' && args[i + 1]) {
      result.days = parseInt(args[i + 1], 10);
      i++; // Skip the next argument
    }
  }
  
  // Validate arguments
  if (result.mode === 'email' && !result.email) {
    // console.log('Usage: node testExpirationNotification.js [--email user@example.com] [--days 10]');
    return { mode: 'help' };
  }
  
  return result;
};

// Main function
const main = async () => {
  // console.log('🚀 Running expiration notification test script...');
  
  const connected = await connectDB();
  if (!connected) {
    // console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  const { mode, email, days } = processArgs();
  
  if (mode === 'email') {
    await testExpirationNotification(email, days);
  } else if (mode === 'find') {
    await findAndNotifyUsers(days);
  }
  
  await mongoose.disconnect();
  // console.log('🔌 MongoDB disconnected');
};

// Run the script
main().then(() => process.exit(0)).catch(err => {
  // console.error('❌ Script error:', err);
  process.exit(1);
});