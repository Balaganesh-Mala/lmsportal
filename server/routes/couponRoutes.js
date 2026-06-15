const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// @route   GET /api/coupons/validate
// @desc    Validate a coupon code
// @access  Public
router.get('/validate', async (req, res) => {
    try {
        const { code, amount } = req.query;
        
        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(), 
            isActive: true 
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Check Expiry
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        // Check Usage Limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        // Check Min Purchase
        if (amount && amount < coupon.minPurchase) {
            return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (amount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        res.json({
            success: true,
            discountAmount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            couponId: coupon._id
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin Routes
// @route   GET /api/coupons
router.get('/', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
        const Student = require('../models/Student');
        
        const couponsWithStudents = await Promise.all(coupons.map(async (coupon) => {
            const students = await Student.find({ couponCode: coupon.code }).select('name email');
            return {
                ...coupon,
                students
            };
        }));
        
        res.json(couponsWithStudents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/coupons
router.post('/', async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json(coupon);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/coupons/:id
router.delete('/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
