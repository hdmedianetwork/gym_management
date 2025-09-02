import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  planType: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Duration in months'
  }
}, {
  timestamps: true
});

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
