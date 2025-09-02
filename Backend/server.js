import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from "./routes/auth.js";
import cashfreeRoutes from "./cashfree/cashfreeRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startCronJob } from "./scripts/checkExpiringMemberships.js";

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.log('Current .env location:', path.join(__dirname, '.env'));
  process.exit(1);
}

console.log('Environment variables loaded successfully');

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
app.use("/api/notifications", notificationRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      
      // Start the cron job for checking expiring memberships
      startCronJob();
      console.log("⏰ Membership expiration check cron job started");
    });
  })
  .catch(err => console.error(err));
