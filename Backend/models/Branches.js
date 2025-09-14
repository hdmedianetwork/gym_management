import mongoose from 'mongoose';

// Schema for the branches collection. Based on provided format:
// { _id: ObjectId, branch1: String, branch2: String }
const branchesSchema = new mongoose.Schema(
  {
    branch1: { type: String, default: '' },
    branch2: { type: String, default: '' },
  },
  {
    collection: 'branches',
    timestamps: false,
    versionKey: false,
  }
);

export default mongoose.model('Branches', branchesSchema);
