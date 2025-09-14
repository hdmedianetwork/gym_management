import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  accountStatus: { type: String, default: 'inactive', enum: ['active', 'inactive', 'suspended','terminated'] },
  planType: { type: String, default: 'no plan' },
  planAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'unpaid', enum: ['paid', 'unpaid', 'pending'] },
  
  // Profile completion fields
  profileComplete: { type: Boolean, default: false },
  profilePhoto: { type: Buffer }, // Store image as binary data
  dateOfBirth: { type: Date },
  address: { type: String },
  branch: { type: String },
  weight: { type: Number }, // in kg
  height: { type: Number } // in cm
}, { timestamps: true });

export default mongoose.model("User", userSchema);
