import express from 'express';
import { getAllPlans, getPlanById, getPlanByType, createPlan, updatePlan, deletePlan } from '../controllers/planController.js';

const router = express.Router();

// GET /api/plans - Get all plans
router.get('/', getAllPlans);

// GET /api/plans/type/:planType - Get plan by type (must come before /:id)
router.get('/type/:planType', getPlanByType);

// GET /api/plans/:id - Get plan by ID
router.get('/:id', getPlanById);

// POST /api/plans - Create a new plan
router.post('/', createPlan);

// PUT /api/plans/:id - Update a plan
router.put('/:id', updatePlan);

// DELETE /api/plans/:id - Delete a plan
router.delete('/:id', deletePlan);

export default router;
