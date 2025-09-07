// ================================
// CASHFREE TRANSACTIONS FETCHER
// ================================

import dotenv from "dotenv";
import {
  fetchAllTransactions,
  printTransactions,
  getTransactionSummary,
} from "../cashfree/fetchTransactions.js";

// Load environment variables
dotenv.config();

// ================================
// MAIN FUNCTION
// ================================
async function fetchAndPrintTransactions() {
  // console.log("\n=== CASHFREE TRANSACTIONS FETCHER ===\n");

  // 1️⃣ Collect order IDs
  const commandLineOrderIds = process.argv.slice(2);
  const defaultOrderIds = [
    "order_1756718748875",
    "order_1756717099673",
    // Add your actual order IDs here
  ];

  const orderIds =
    commandLineOrderIds.length > 0 ? commandLineOrderIds : defaultOrderIds;

  if (orderIds.length === 0) {
    // console.log("❌ No order IDs provided!");
    // console.log("\nUsage:");
    // console.log("  node scripts/fetchTransactions.js ORDER1 ORDER2 ORDER3");
    // console.log("\nOr modify the defaultOrderIds array in this script.");
    return;
  }

  // 2️⃣ Validate environment variables
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    // console.error("❌ Error: Cashfree credentials not found!");
    // console.log(
    //   "Make sure you have CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env file"
    // );
    return;
  }

  // console.log("✅ Cashfree credentials loaded");
  // console.log("📦 Order IDs to fetch:", orderIds);
  // console.log("\n" + "=".repeat(50) + "\n");

  // 3️⃣ Fetch transactions
  try {
    const transactions = await fetchAllTransactions(orderIds);

    if (transactions.length === 0) {
      // console.log("❌ No transactions found for the provided order IDs.");
      return;
    }

    // 4️⃣ Print detailed transactions
    printTransactions(transactions);

    // 5️⃣ Print summary
    const summary = getTransactionSummary(transactions);
    // console.log("\n" + "=".repeat(50));
    // console.log("📊 TRANSACTION SUMMARY");
    // console.log("=".repeat(50));
    // console.log(`📈 Total Transactions: ${summary.total}`);
    // console.log(`✅ Successful: ${summary.successful}`);
    // console.log(`❌ Failed: ${summary.failed}`);
    // console.log(`⏳ Pending: ${summary.pending}`);
    // console.log(`💰 Total Successful Amount: ₹${summary.totalAmount.toFixed(2)}`);
    // console.log("=".repeat(50));
  } catch (error) {
    // console.error("❌ Error fetching transactions:", error.message);

    if (error.response) {
      // console.error("API Response:", error.response.data);
    }
  }
}

// ================================
// RUN THE SCRIPT
// ================================
fetchAndPrintTransactions()
  .then(() => {
    // console.log("\n✅ Transaction fetch completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
