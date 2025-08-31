import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { generateOTP, sendOTP } from "../utils/emailService.js";

const router = express.Router();

// Check admin email
router.post("/check-admin-email", async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    // Check if request body exists and has email
    if (!req.body || typeof req.body.email !== 'string') {
      console.log('Invalid request body or email format');
      return res.status(400).json({ 
        error: 'Valid email is required',
        received: req.body 
      });
    }

    const email = req.body.email.trim().toLowerCase();
    console.log('User entered email:', email);
    const allAdmins = await Admin.find({});
    console.log('Emails in MongoDB:', allAdmins.map(a => a.email));
    // Check if email is not empty after trimming
    if (!email) {
      console.log('Empty email after trimming');
      return res.status(400).json({ error: 'Email cannot be empty' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    
    if (admin) {
      console.log("Admin found in database:", admin.email);
      return res.json({ 
        found: true, 
        email: admin.email,  // Make sure this is included
        isVerified: admin.isVerified,
        message: 'Admin email verified'
      });
    } else {
      console.log("No admin found with email:", email);
      return res.json({ 
        found: false,
        message: 'No admin found with this email'
      });
    }
  } catch (err) {
    console.error("Error in check-admin-email:", err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
});

// Send OTP to admin
router.post("/admin/send-otp", async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(400).json({ error: "Admin not found" });
    }
    
    // Remove verification check to allow OTP for all registered emails
    // if (!admin.isVerified) {
    //   return res.status(403).json({ error: "Admin account not verified" });
    // }
    
    const otp = generateOTP();
    admin.otp = otp;
    admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await admin.save();
    
    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
    
    res.json({ 
      success: true,
      message: 'OTP sent successfully' 
    });
  } catch (err) {
    console.error("Error in admin/send-otp:", err);
    res.status(500).json({ 
      error: 'Failed to process OTP request',
      details: err.message 
    });
  }
});

// Verify admin OTP
router.post("/admin/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Verifying OTP for email:', email, 'OTP received:', otp);
    
    if (!email || !otp) {
      console.log('Missing email or OTP');
      return res.status(400).json({ error: "Email and OTP are required" });
    }
    
    // Log all OTPs in the database for debugging
    const allAdmins = await Admin.find({ email: email.trim().toLowerCase() });
    console.log('All matching admins:', allAdmins.map(a => ({
      email: a.email,
      storedOTP: a.otp,
      otpExpires: a.otpExpires,
      isExpired: a.otpExpires < new Date()
    })));
    
    const admin = await Admin.findOne({ 
      email: email.trim().toLowerCase(),
      otp,
      otpExpires: { $gt: new Date() }
    });
    
    if (!admin) {
      return res.status(400).json({ 
        error: "Invalid or expired OTP" 
      });
    }
    
    // Clear OTP fields
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true,
      message: "OTP verified, access granted",
      token
    });
  } catch (err) {
    console.error("Error in admin/verify-otp:", err);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      details: err.message 
    });
  }
});

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user or create new user if not exists
    let user = await User.findOneAndUpdate(
      { email },
      { 
        otp,
        otpExpires,
        isVerified: false 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP to email
    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP and Register
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, name, password, mobile } = req.body;

    // Find user with the provided email and OTP
    const user = await User.findOne({ 
      email, 
      otp,
      otpExpires: { $gt: Date.now() } // Check if OTP is not expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with verified status and clear OTP
    user.name = name;
    user.password = hashedPassword;
    user.mobile = mobile;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      message: "Registration successful",
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        isVerified: user.isVerified
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: "Email not verified. Please verify your email first.",
        needsVerification: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        isVerified: user.isVerified
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected route
router.get("/me", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
