import mongoose from 'mongoose';

// Schema for the branches collection with dynamic branch fields
const branchesSchema = new mongoose.Schema(
  {},
  {
    collection: 'branches',
    timestamps: false,
    versionKey: false,
    strict: false // Allow dynamic fields
  }
);

// Add a method to get all branches as an array
branchesSchema.methods.getBranchesArray = function() {
  return Object.entries(this.toObject())
    .filter(([key]) => key.startsWith('branch') && this[key])
    .map(([key, value]) => ({
      id: key,
      name: value
    }));
};

// Add a method to add a new branch
branchesSchema.statics.addBranch = async function(branchName) {
  console.log('Adding new branch:', branchName);
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the document (there should only be one)
    let doc = await this.findOne({}).session(session).lean();
    console.log('Found existing document:', doc ? 'Yes' : 'No');
    
    if (!doc) {
      // Create new document if it doesn't exist
      doc = new this({});
      console.log('Created new document');
    } else {
      // Convert to plain object if it's a mongoose document
      doc = doc.toObject ? doc.toObject() : doc;
    }
    
    // Find the next available branch field
    const branchFields = Object.keys(doc)
      .filter(key => key.startsWith('branch'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('branch', '')) || 0;
        const numB = parseInt(b.replace('branch', '')) || 0;
        return numA - numB;
      });
    
    // Find the next available branch number
    let nextBranchNum = 1;
    for (const field of branchFields) {
      const num = parseInt(field.replace('branch', '')) || 0;
      if (num >= nextBranchNum) {
        nextBranchNum = num + 1;
      }
    }
    
    // Add the new branch
    const newField = `branch${nextBranchNum}`;
    console.log('Adding field:', newField, 'with value:', branchName);
    
    // Use findOneAndUpdate with upsert to ensure the document is saved
    const updatedDoc = await this.findOneAndUpdate(
      { _id: doc._id || new mongoose.Types.ObjectId() },
      { $set: { [newField]: branchName } },
      { 
        new: true, 
        upsert: true, 
        session,
        setDefaultsOnInsert: true 
      }
    );
    
    await session.commitTransaction();
    console.log('Document updated successfully');
    console.log('Updated document:', updatedDoc);
    
    return updatedDoc;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in addBranch:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export default mongoose.model('Branches', branchesSchema);
