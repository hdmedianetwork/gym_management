import dotenv from 'dotenv';
import { exampleFetchAndPrint } from '../cashfree/fetchTransactions.js';
// Load environment variables
dotenv.config();
// Test script to fetch and print transactions
async function testFetchTransactions() {
  // console.log('\n=== CASHFREE TRANSACTION FETCHER TEST ===\n');

  // Check if environment variables are loaded
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    // console.error('❌ Error: Cashfree credentials not found in environment variables!');
    // console.log('Make sure you have CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env file');
    return;
  }

  // console.log('✅ Environment variables loaded successfully');
  // console.log(`App ID: ${process.env.CASHFREE_APP_ID.substring(0, 10)}...`);
  // console.log('Secret Key: [HIDDEN FOR SECURITY]\n');

  // Run the example fetch
  try {
    await exampleFetchAndPrint();
  } catch (error) {
    // console.error('❌ Error during transaction fetch:', error.message);
  }
}

// Run the test
testFetchTransactions().then(() => {
  // console.log('\n=== TEST COMPLETED ===');
  process.exit(0);
}).catch((error) => {
  // console.error('❌ Test failed:', error.message);
  process.exit(1);
});