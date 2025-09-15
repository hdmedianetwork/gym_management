import Plan from '../models/Plan.js';

// Get all plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ amount: 1 }); // Sort by amount ascending
    res.status(200).json({
      success: true,
      data: plans,
      message: 'Plans fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
      error: error.message
    });
  }
};

// Get plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
      message: 'Plan fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan',
      error: error.message
    });
  }
};

// Get plan by type
export const getPlanByType = async (req, res) => {
  try {
    const { planType } = req.params;
    const plan = await Plan.findOne({ planType: planType.toLowerCase() });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
      message: 'Plan fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching plan by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan',
      error: error.message
    });
  }
};

// Create a new plan
export const createPlan = async (req, res) => {
  try {
    let { planType, amount, duration } = req.body;

    if (!planType || amount === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'planType, amount and duration are required'
      });
    }

    planType = String(planType).trim().toLowerCase();
    amount = Number(amount);
    duration = Number(duration);

    if (!planType) {
      return res.status(400).json({ success: false, message: 'Invalid planType' });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!Number.isInteger(duration) || duration < 1) {
      return res.status(400).json({ success: false, message: 'Invalid duration' });
    }

    const newPlan = await Plan.create({ planType, amount, duration });

    return res.status(201).json({
      success: true,
      data: newPlan,
      message: 'Plan created successfully'
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Plan type already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create plan',
      error: error.message
    });
  }
};

// Update a plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if ('planType' in req.body) {
      const pt = String(req.body.planType).trim().toLowerCase();
      if (!pt) return res.status(400).json({ success: false, message: 'Invalid planType' });
      updates.planType = pt;
    }
    if ('amount' in req.body) {
      const amt = Number(req.body.amount);
      if (!Number.isFinite(amt) || amt < 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
      updates.amount = amt;
    }
    if ('duration' in req.body) {
      const dur = Number(req.body.duration);
      if (!Number.isInteger(dur) || dur < 1) return res.status(400).json({ success: false, message: 'Invalid duration' });
      updates.duration = dur;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const updated = await Plan.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    return res.status(200).json({ success: true, data: updated, message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating plan:', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Plan type already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update plan', error: error.message });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Plan.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    return res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete plan', error: error.message });
  }
};
