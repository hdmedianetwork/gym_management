import CouponCode from '../models/CouponCode.js';

// Get all coupon codes
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await CouponCode.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: coupons,
      message: 'Coupons fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
    });
  }
};

// Get coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await CouponCode.findById(id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
      message: 'Coupon fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// Get coupon by code
export const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
      message: 'Coupon fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching coupon by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// Create a new coupon
export const createCoupon = async (req, res) => {
  try {
    let { code, discount, discountType } = req.body;

    if (!code || !discount || !discountType) {
      return res.status(400).json({
        success: false,
        message: 'Code, discount, and discountType are required'
      });
    }

    code = String(code).trim().toUpperCase();
    discount = String(discount).trim();
    discountType = String(discountType).trim().toLowerCase();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }
    if (!discount) {
      return res.status(400).json({ success: false, message: 'Invalid discount' });
    }
    if (!['percentage', 'amount'].includes(discountType)) {
      return res.status(400).json({ success: false, message: 'Invalid discount type. Must be "percentage" or "amount"' });
    }

    const newCoupon = await CouponCode.create({ code, discount, discountType });

    return res.status(201).json({
      success: true,
      data: newCoupon,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Update a coupon
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if ('code' in req.body) {
      const code = String(req.body.code).trim().toUpperCase();
      if (!code) return res.status(400).json({ success: false, message: 'Invalid code' });
      updates.code = code;
    }
    if ('discount' in req.body) {
      const discount = String(req.body.discount).trim();
      if (!discount) return res.status(400).json({ success: false, message: 'Invalid discount' });
      updates.discount = discount;
    }
    if ('discountType' in req.body) {
      const discountType = String(req.body.discountType).trim().toLowerCase();
      if (!['percentage', 'amount'].includes(discountType)) {
        return res.status(400).json({ success: false, message: 'Invalid discount type. Must be "percentage" or "amount"' });
      }
      updates.discountType = discountType;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const updated = await CouponCode.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.status(200).json({ success: true, data: updated, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update coupon', error: error.message });
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CouponCode.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
  }
};