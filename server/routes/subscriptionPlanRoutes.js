const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');

// @route   GET /api/subscription-plans
// @desc    Get all active subscription plans
// @access  Public
router.get('/', async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/subscription-plans
// @desc    Create a new plan
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const plan = new SubscriptionPlan(req.body);
        const newPlan = await plan.save();
        res.status(201).json(newPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/subscription-plans/:id
// @desc    Update a plan
// @access  Admin
router.put('/:id', async (req, res) => {
    try {
        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/subscription-plans/:id
// @desc    Delete a plan
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        await SubscriptionPlan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
