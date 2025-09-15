import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  orderAmount: { 
    type: Number, 
    required: true 
  },
  orderCurrency: { 
    type: String, 
    default: 'INR' 
  },
  paymentStatus: { 
    type: String, 
    default: 'initiated',
    enum: ['initiated', 'paid', 'failed', 'cancelled', 'pending']
  },
  paymentSessionId: { 
    type: String 
  },
  customerDetails: {
    customerName: String,
    customerEmail: String,
    customerPhone: String
  },
  planType: {
    type: String
  },
  planAmount: {
    type: Number
  },
  planDuration: {
    type: Number
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Store Cashfree response data
  cashfreeData: {
    type: mongoose.Schema.Types.Mixed
  },
  paymentCompletedAt: Date,
  // Track payment attempts
  attempts: [{
    timestamp: { type: Date, default: Date.now },
    status: String,
    response: mongoose.Schema.Types.Mixed
  }]
}, { 
  timestamps: true 
});

// Index for faster queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
