import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';

dotenv.config();

async function updateActivePayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update all payments with status 'active' to 'paid'
    const result = await Payment.updateMany(
      { paymentStatus: 'active' },
      { $set: { paymentStatus: 'paid' } }
    );

    console.log(`Updated ${result.modifiedCount} payments from 'active' to 'paid'`);
    
    // Verify the update
    const activePayments = await Payment.countDocuments({ paymentStatus: 'active' });
    console.log(`Remaining payments with 'active' status: ${activePayments}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating payments:', error);
    process.exit(1);
  }
}

// Run the script
updateActivePayments();
