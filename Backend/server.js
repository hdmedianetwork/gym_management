import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from "./routes/auth.js";
import cashfreeRoutes from "./cashfree/cashfreeRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startCronJob } from "./scripts/checkExpiringMemberships.js";
import cron from 'node-cron';
import { syncPaymentStatuses } from './jobs/syncPayments.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  // console.error('Missing required environment variables:', missingVars.join(', '));
  // console.log('Current .env location:', path.join(__dirname, '.env'));
  process.exit(1);
}

// console.log('Environment variables loaded successfully');

const app = express();
app.use(express.json());
// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://gymfit-phi.vercel.app',
  'https://gymfit-phi.vercel.app/'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if the origin is in the allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.get("/",(req,res)=>{
  res.send("Hello World!")
})
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", cashfreeRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);

// Branches route
app.get("/api/branches", async (req, res) => {
  try {
    // Import Branches model here to avoid circular dependency
    const Branches = (await import("./models/Branches.js")).default;
    
    // Fetch branches from database
    const branchesData = await Branches.findOne({});
    
    if (!branchesData) {
      return res.status(404).json({ success: false, error: 'No branches found' });
    }
    
    // Convert to array of branch names, filtering out empty values
    const branches = [];
    if (branchesData.branch1) branches.push(branchesData.branch1);
    if (branchesData.branch2) branches.push(branchesData.branch2);
    
    res.status(200).json({ success: true, branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch branches' });
  }
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startCronJob();
      console.log("⏰ Membership expiration check cron job started");
      
      // Schedule payment status sync to run every hour
      cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled payment status sync...');
        try {
          const result = await syncPaymentStatuses();
          console.log('Scheduled payment sync completed:', result);
        } catch (error) {
          console.error('Error in scheduled payment sync:', error);
        }
      });
      
      // Initial sync
      syncPaymentStatuses().catch(console.error);
    });
  })
  .catch(err => {
    // console.error(err)
  });
