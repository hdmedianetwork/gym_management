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
