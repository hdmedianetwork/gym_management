import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';

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

// Calculate days remaining until membership expiration
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

// Get colored text for days remaining
const getColoredDaysText = (days) => {
  if (days === null) return '\x1b[90mN/A\x1b[0m'; // Gray for N/A
  
  if (days < 0) return `\x1b[31mExpired\x1b[0m`; // Red for expired
  if (days === 0) return `\x1b[31m${days}\x1b[0m`; // Red for today
  if (days <= 10) return `\x1b[33m${days}\x1b[0m`; // Yellow for <= 10 days
  if (days <= 30) return `\x1b[32m${days}\x1b[0m`; // Green for <= 30 days
  return `\x1b[36m${days}\x1b[0m`; // Cyan for > 30 days
};

// Format date for display, including time
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d)) return 'N/A';
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

// Calculate end date based on latest payment and plan duration
const calculateEndDate = async (user) => {
  console.log(`🔍 Calculating end date for user: ${user.name} (${user.email})`);
  
  // Find all payments for the user using customerEmail
  const payments = await Payment.find({ 
    'customerDetails.customerEmail': { $regex: `^${user.email}$`, $options: 'i' }, // Case-insensitive match
    paymentStatus: { $in: ['paid', 'SUCCESS'] } // Include both paid and SUCCESS statuses
  }).lean();
  
  console.log(`💰 Found ${payments.length} payment(s) for ${user.email}`);
  
  // Sort payments by createdAt (descending) to get the latest
  const latestPayment = payments.sort((a, b) => {
    const dateA = a.createdAt;
    const dateB = b.createdAt;
    return new Date(dateB) - new Date(dateA); // Latest first
  })[0];
  
  if (latestPayment) {
    console.log(`✅ Latest payment for ${user.email}:`, {
      _id: latestPayment._id,
      orderAmount: latestPayment.orderAmount,
      paymentStatus: latestPayment.paymentStatus,
      createdAt: latestPayment.createdAt
    });
  } else {
    console.log(`❌ No valid payment found for ${user.email} - using user.createdAt as fallback`);
  }
  
  // If no payment exists, use user creation date
  const startDate = latestPayment ? latestPayment.createdAt : user.createdAt;
  if (!startDate) {
    console.log(`❌ No start date available for ${user.email}`);
    return null;
  }
  
  console.log(`📅 Start date: ${formatDate(startDate)}`);
  
  // Get all plans from database
  const plans = await Plan.find({}).lean();
  
  // If no payment, return null (no plan to calculate duration)
  if (!latestPayment) {
    console.log(`❌ No payment found for ${user.email} - cannot calculate end date`);
    return null;
  }
  
  // Find matching plan based on orderAmount
  const plan = plans.find(p => Number(p.amount) === Number(latestPayment.orderAmount));
  
  if (!plan || !plan.duration) {
    console.log(`❌ No matching plan found for amount ${latestPayment.orderAmount} or plan has no duration`);
    return null;
  }
  
  console.log(`📋 Matched plan:`, {
    planType: plan.planType,
    amount: plan.amount,
    duration: plan.duration
  });
  
  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(plan.duration));
  
  console.log(`🎉 Calculated end date: ${formatDate(endDate)}`);
  return endDate;
};

// Check remaining days for all users
const checkRemainingDays = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 CHECKING MEMBERSHIP EXPIRATION DAYS');
  console.log('='.repeat(60));
  
  try {
    // Get all active users
    const users = await User.find({ 
      accountStatus: 'active',
      paymentStatus: 'paid'
    }).lean();
    
    console.log(`📋 Found ${users.length} active users`);
    
    // Get all payments
    const payments = await Payment.find({ paymentStatus: { $in: ['paid', 'SUCCESS'] } }).lean();
    
    console.log(`💰 Found ${payments.length} payment records`);
    
    // Process each user
    console.log('\n' + '-'.repeat(80));
    console.log(sprintf('| %-25s | %-20s | %-25s | %-15s |', 'Name', 'Email', 'End Date', 'Days Left'));
    console.log('-'.repeat(80));
    
    // Define sprintf function for formatting
    function sprintf(format, ...args) {
      return format.replace(/%(-?)(\d+)?s/g, (match, leftAlign, width, index) => {
        const arg = String(args.shift() || '');
        const padLength = width ? parseInt(width) : 0;
        if (padLength <= arg.length) return arg;
        const padding = ' '.repeat(padLength - arg.length);
        return leftAlign ? arg + padding : padding + arg;
      });
    }
    
    // Prepare user data with expiration info
    const userData = [];
    
    for (const user of users) {
      // Calculate end date
      const endDate = await calculateEndDate(user);
      
      // Calculate days remaining
      const daysRemaining = calculateDaysRemaining(endDate);
      
      // Format for display
      const formattedEndDate = formatDate(endDate);
      
      userData.push({
        name: user.name,
        email: user.email,
        endDate,
        formattedEndDate,
        daysRemaining
      });
    }
    
    // Sort users by days remaining (null values at the end)
    userData.sort((a, b) => {
      if (a.daysRemaining === null && b.daysRemaining === null) return 0;
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
    
    // Print sorted user data
    for (const user of userData) {
      console.log(
        sprintf(
          '| %-25s | %-20s | %-25s | %-15s |',
          user.name.substring(0, 25),
          user.email.substring(0, 20),
          user.formattedEndDate.substring(0, 25),
          getColoredDaysText(user.daysRemaining)
        )
      );
    }
    
    console.log('-'.repeat(80));
    
    // Calculate statistics
    const stats = {
      total: userData.length,
      expiring10Days: 0,
      expiring30Days: 0,
      expired: 0,
      noEndDate: 0
    };
    
    userData.forEach(user => {
      if (user.daysRemaining === null) {
        stats.noEndDate++;
      } else if (user.daysRemaining < 0) {
        stats.expired++;
      } else if (user.daysRemaining <= 10) {
        stats.expiring10Days++;
      } else if (user.daysRemaining <= 30) {
        stats.expiring30Days++;
      }
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MEMBERSHIP EXPIRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total active users: ${stats.total}`);
    console.log(`⚠️  Expiring in 10 days: ${stats.expiring10Days}`);
    console.log(`🔔 Expiring in 11-30 days: ${stats.expiring30Days}`);
    console.log(`❌ Expired: ${stats.expired}`);
    console.log(`❓ No end date found: ${stats.noEndDate}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error checking remaining days:', error);
  }
};

// Run as standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🚀 Running membership days remaining check script...');
  
  connectDB().then(connected => {
    if (connected) {
      checkRemainingDays().then(() => {
        console.log('✅ Check completed');
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

export { checkRemainingDays };