import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { generateOTP, sendOTP } from "../utils/emailService.js";

// Configure multer for profile photo upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Import Branches model
import Branches from "../models/Branches.js";

// Get all branches
router.get('/branches', async (req, res) => {
  try {
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

// Get all users for admin dashboard
router.get("/admin/all-users", async (req, res) => {
  try {
    const users = await User.find({ isVerified: true });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    user.name = name.trim();
    user.password = hashedPassword;
    user.mobile = mobile.trim();
    user.isVerified = true;
    user.accountStatus = 'inactive';
    user.planType = 'no plan';
    user.paymentStatus = 'unpaid';
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
        isVerified: user.isVerified,
        profileComplete: user.profileComplete
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
        isVerified: user.isVerified,
        profileComplete: user.profileComplete
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

// Admin: update user account status (e.g., terminate)
router.patch("/admin/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    const allowed = ['active', 'inactive', 'suspended', 'terminated'];
    if (!allowed.includes((accountStatus || '').toLowerCase())) {
      return res.status(400).json({ error: 'Invalid accountStatus value' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: accountStatus.toLowerCase() },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: manually create a user
router.post('/admin/users', async (req, res) => {
  try {
    const { name, email, mobile, accountStatus, planAmount, paymentStatus } = req.body;

    if (!name || !email || !mobile) {
      return res.status(400).json({ error: 'name, email and mobile are required' });
    }

    const statusAllowed = ['active', 'inactive', 'suspended', 'terminated'];
    const payAllowed = ['paid', 'unpaid', 'pending'];

    const normalizedStatus = (accountStatus || 'inactive').toLowerCase();
    const normalizedPay = (paymentStatus || 'unpaid').toLowerCase();

    if (!statusAllowed.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid accountStatus' });
    }
    if (!payAllowed.includes(normalizedPay)) {
      return res.status(400).json({ error: 'Invalid paymentStatus' });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Temporary password strategy: last 6 digits of mobile or a random fallback
    const tempPassword = (String(mobile).replace(/\D/g, '').slice(-6)) || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      mobile: String(mobile).trim(),
      isVerified: true,
      accountStatus: normalizedStatus,
      planType: 'manual',
      planAmount: Number(planAmount) || 0,
      paymentStatus: normalizedPay,
      otp: undefined,
      otpExpires: undefined,
    });

    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: update user details (conditional fields)
router.patch('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isManual = (user.planType || '').toLowerCase() === 'manual';

    // Whitelists
    const manualAllowed = ['name', 'email', 'mobile', 'accountStatus', 'paymentStatus', 'planAmount', 'dateOfBirth', 'height', 'weight', 'branch', 'address'];
    const signupAllowed = ['name', 'email', 'mobile', 'dateOfBirth', 'height', 'weight', 'branch', 'address'];
    const allowed = isManual ? manualAllowed : signupAllowed;

    // Build update object
    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    // Normalize specific fields
    if ('email' in update) update.email = String(update.email).trim().toLowerCase();
    if ('accountStatus' in update) update.accountStatus = String(update.accountStatus).toLowerCase();
    if ('paymentStatus' in update) update.paymentStatus = String(update.paymentStatus).toLowerCase();
    if ('planAmount' in update) update.planAmount = Number(update.planAmount) || 0;

    // Validate enum fields when present
    const statusAllowed = ['active', 'inactive', 'suspended', 'terminated'];
    const payAllowed = ['paid', 'unpaid', 'pending'];
    if (update.accountStatus && !statusAllowed.includes(update.accountStatus)) {
      return res.status(400).json({ error: 'Invalid accountStatus' });
    }
    if (update.paymentStatus && !payAllowed.includes(update.paymentStatus)) {
      return res.status(400).json({ error: 'Invalid paymentStatus' });
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true });
    return res.json({ success: true, user: updated, editableFields: allowed });
  } catch (err) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await user.save();

    // Send OTP via email
    const emailSent = await sendOTP(email, otp, 'password-reset');
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      email: user.email // Return hashed email for security
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP for password reset
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      otp: otp,
      otpExpires: { $gt: Date.now() } // OTP not expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // OTP is valid
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      email: user.email
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find user by email and OTP
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      otp: otp,
      otpExpires: { $gt: Date.now() } // OTP not expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete Profile - After OTP verification
router.post("/complete-profile", upload.single('profilePhoto'), async (req, res) => {
  try {
    const { userId, dateOfBirth, address, branch, weight, height } = req.body;
    
    if (!userId || !dateOfBirth || !address || !branch || !weight || !height) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Get valid branches from database
    const branchesData = await Branches.findOne({});
    if (!branchesData) {
      return res.status(500).json({ error: "Error validating branch" });
    }
    
    const validBranches = [
      branchesData.branch1?.toLowerCase(),
      branchesData.branch2?.toLowerCase()
    ].filter(Boolean);
    
    // Validate branch
    if (!validBranches.includes(branch.toLowerCase())) {
      return res.status(400).json({ error: "Invalid branch selection" });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ error: "User not verified" });
    }
    
    // Update user profile
    user.dateOfBirth = new Date(dateOfBirth);
    user.address = address.trim();
    user.branch = branch.toLowerCase();
    user.weight = parseFloat(weight);
    user.height = parseFloat(height);
    user.profileComplete = true;
    
    // Handle profile photo
    if (req.file) {
      user.profilePhoto = req.file.buffer;
    }
    
    await user.save();
    
    // Generate new token with updated user info
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    res.json({ 
      success: true,
      message: "Profile completed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileComplete: user.profileComplete
      }
    });
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user profile photo
router.get("/profile-photo/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || !user.profilePhoto) {
      return res.status(404).json({ error: "Profile photo not found" });
    }
    
    res.set('Content-Type', 'image/jpeg');
    res.send(user.profilePhoto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check profile completion status
router.get("/profile-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('profileComplete');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ profileComplete: user.profileComplete });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
