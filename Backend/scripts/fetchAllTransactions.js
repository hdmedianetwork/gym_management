// ================================
// FETCH ALL TRANSACTIONS SCRIPT
// ================================

import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  fetchAllTransactions,
  printTransactions,
  getTransactionSummary,
} from "../cashfree/fetchTransactions.js";
import Payment from "../models/Payment.js";

// Load environment variables
dotenv.config();

// ================================
// MAIN FUNCTION
// ================================
async function fetchAndPrintAllTransactions() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 CASHFREE ALL TRANSACTIONS FETCHER");
  console.log("=".repeat(70));

  try {
    // 1️⃣ Validate environment variables
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error("❌ Error: Cashfree credentials not found!");
      console.log(
        "Make sure you have CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env file"
      );
      return;
    }

    if (!process.env.MONGO_URI) {
      console.error("❌ Error: MongoDB URI not found!");
      console.log("Make sure you have MONGO_URI in your .env file");
      return;
    }

    console.log("✅ Environment variables loaded");

    // 2️⃣ Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // 3️⃣ Get all payment records from database
    console.log("\n📋 Fetching payment records from database...");
    const paymentRecords = await Payment.find({})
      .populate("userId", "name email mobile planType")
      .sort({ createdAt: -1 }); // Latest first

    if (paymentRecords.length === 0) {
      console.log("❌ No payment records found in database.");
      console.log("\n💡 Tip: Make sure payments are being saved to the database when orders are created.");
      return;
    }

    console.log(`📦 Found ${paymentRecords.length} payment records in database`);

    // 4️⃣ Extract order IDs
    const orderIds = paymentRecords.map((payment) => payment.orderId);
    console.log("🏷️ Order IDs to fetch from Cashfree:");
    if (orderIds.length <= 10) {
      console.log("   ", orderIds.join(", "));
    } else {
      console.log("   ", orderIds.slice(0, 10).join(", "), `... and ${orderIds.length - 10} more`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🌐 FETCHING TRANSACTION DETAILS FROM CASHFREE");
    console.log("=".repeat(70));

    // 5️⃣ Fetch transactions from Cashfree
    const cashfreeTransactions = await fetchAllTransactions(orderIds);

    if (cashfreeTransactions.length === 0) {
      console.log("❌ No transactions found from Cashfree for the provided order IDs.");
      console.log("🔍 This might happen if orders are very new or if there were API issues.");
      return;
    }

    // 6️⃣ Combine database records with Cashfree data
    console.log("🔄 Combining database records with Cashfree data...");
    const enhancedTransactions = cashfreeTransactions.map((transaction) => {
      const dbRecord = paymentRecords.find((record) => record.orderId === transaction.orderId);
      return {
        ...transaction,
        databaseInfo: dbRecord
          ? {
              userId: dbRecord.userId,
              planType: dbRecord.planType,
              createdInDb: dbRecord.createdAt,
              paymentStatusInDb: dbRecord.paymentStatus,
            }
          : null,
      };
    });

    // 7️⃣ Print detailed transactions to console
    printTransactions(enhancedTransactions);

    // 8️⃣ Print comprehensive summary
    console.log("\n" + "=".repeat(70));
    console.log("💾 DATABASE RECORDS SUMMARY");
    console.log("=".repeat(70));

    const dbSummary = paymentRecords.reduce(
      (acc, record) => {
        acc.total += 1;
        switch (record.paymentStatus) {
          case "paid":
            acc.paid += 1;
            acc.totalPaidAmount += record.orderAmount;
            break;
          case "failed":
            acc.failed += 1;
            break;
          case "pending":
          case "active":
            acc.pending += 1;
            break;
          case "initiated":
            acc.initiated += 1;
            break;
        }
        acc.totalAmount += record.orderAmount;
        return acc;
      },
      { total: 0, paid: 0, failed: 0, pending: 0, initiated: 0, totalAmount: 0, totalPaidAmount: 0 }
    );

    console.log(`📊 Total Database Records: ${dbSummary.total}`);
    console.log(`✅ Paid: ${dbSummary.paid}`);
    console.log(`❌ Failed: ${dbSummary.failed}`);
    console.log(`⏳ Pending: ${dbSummary.pending}`);
    console.log(`🔄 Initiated: ${dbSummary.initiated}`);
    console.log(`💰 Total Amount (All): ₹${dbSummary.totalAmount.toFixed(2)}`);
    console.log(`💸 Total Amount (Paid): ₹${dbSummary.totalPaidAmount.toFixed(2)}`);

    // Print Cashfree summary
    const cashfreeSummary = getTransactionSummary(enhancedTransactions);
    console.log("\n" + "=".repeat(70));
    console.log("🌐 CASHFREE API SUMMARY");
    console.log("=".repeat(70));
    console.log(`📈 Total Fetched from API: ${cashfreeSummary.total}`);
    console.log(`✅ Successful: ${cashfreeSummary.successful}`);
    console.log(`❌ Failed: ${cashfreeSummary.failed}`);
    console.log(`⏳ Pending: ${cashfreeSummary.pending}`);
    console.log(`💰 Total Successful Amount: ₹${cashfreeSummary.totalAmount.toFixed(2)}`);

    // 9️⃣ Plan Type Breakdown
    console.log("\n" + "=".repeat(70));
    console.log("📋 PLAN TYPE BREAKDOWN");
    console.log("=".repeat(70));

    const planBreakdown = paymentRecords.reduce((acc, record) => {
      const plan = record.planType || "unknown";
      if (!acc[plan]) {
        acc[plan] = { count: 0, amount: 0, paid: 0 };
      }
      acc[plan].count += 1;
      acc[plan].amount += record.orderAmount;
      if (record.paymentStatus === "paid") {
        acc[plan].paid += 1;
      }
      return acc;
    }, {});

    Object.entries(planBreakdown).forEach(([plan, data]) => {
      console.log(`🎯 ${plan.toUpperCase()}: ${data.count} orders, ${data.paid} paid, ₹${data.amount.toFixed(2)}`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL TRANSACTIONS FETCHED SUCCESSFULLY!");
    console.log("=".repeat(70));

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Database connection closed");
    }
  }
}

// ================================
// RUN THE SCRIPT
// ================================
fetchAndPrintAllTransactions()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
