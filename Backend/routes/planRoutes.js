import express from 'express';
import { getAllPlans, getPlanById, getPlanByType } from '../controllers/planController.js';

const router = express.Router();

// GET /api/plans - Get all plans
router.get('/', getAllPlans);

// GET /api/plans/type/:planType - Get plan by type (must come before /:id)
router.get('/type/:planType', getPlanByType);

// GET /api/plans/:id - Get plan by ID
router.get('/:id', getPlanById);

export default router;
