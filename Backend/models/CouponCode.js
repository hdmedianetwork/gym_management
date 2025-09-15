import mongoose from 'mongoose';

const couponCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discount: {
    type: String,
    required: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'amount'],
    trim: true
  }
}, {
  collection: 'coupancodes',
  timestamps: true
});

const CouponCode = mongoose.model('CouponCode', couponCodeSchema);

export default CouponCode;