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
  paymentStatus: { type: String, default: 'unpaid', enum: ['paid', 'unpaid', 'pending'] }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
