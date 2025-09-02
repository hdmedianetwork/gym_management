// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Plan from '../models/Plan.js';

// // Configure environment variables
// dotenv.config({ path: '../.env' });

// const updatePlans = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ MongoDB Connected');

//     // Update plan amounts to correct values
//     const updates = [
//       { planType: 'basic', amount: 999, duration: 1 },
//       { planType: 'standard', amount: 1999, duration: 3 },
//       { planType: 'premium', amount: 2998, duration: 6 }
//     ];

//     for (const update of updates) {
//       const result = await Plan.findOneAndUpdate(
//         { planType: update.planType },
//         { 
//           amount: update.amount,
//           duration: update.duration 
//         },
//         { new: true, upsert: true } // Create if doesn't exist
//       );
//       console.log(`✅ Updated ${update.planType} plan:`, result);
//     }

//     console.log('✅ All plans updated successfully!');
//   } catch (error) {
//     console.error('❌ Error updating plans:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('🔌 MongoDB disconnected');
//   }
// };

// updatePlans();
