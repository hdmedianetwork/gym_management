import express from 'express';
import { getAllCoupons, getCouponById, getCouponByCode, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js';

const router = express.Router();

// GET /api/coupons - Get all coupons
router.get('/', getAllCoupons);

// GET /api/coupons/code/:code - Get coupon by code (must come before /:id)
router.get('/code/:code', getCouponByCode);

// GET /api/coupons/:id - Get coupon by ID
router.get('/:id', getCouponById);

// POST /api/coupons - Create a new coupon
router.post('/', createCoupon);

// PUT /api/coupons/:id - Update a coupon
router.put('/:id', updateCoupon);

// DELETE /api/coupons/:id - Delete a coupon
router.delete('/:id', deleteCoupon);

export default router;