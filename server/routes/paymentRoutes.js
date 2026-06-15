const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Student = require('../models/Student');

// Initialize Razorpay
// Note: We use try/catch to prevent crashes if keys are not set yet
let razorpayInstance = null;
try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder'
    });
} catch (e) {
    console.error("Razorpay initialization failed. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env", e);
}

const SubscriptionPlan = require('../models/SubscriptionPlan');

// @route   POST /api/payment/create-subscription
// @desc    Create a Razorpay order for subscription
// @access  Protected
router.post('/create-subscription', async (req, res) => {
    try {
        const { studentId, planId, couponCode } = req.body;
        
        let amount = 50000; // Default fallback (Rs 500)
        let planTitle = "Student Portal Subscription";

        if (planId) {
            const plan = await SubscriptionPlan.findById(planId);
            if (plan) {
                amount = plan.price * 100; // Convert to paise
                planTitle = plan.title;
            }
        }

        // Apply Coupon if provided
        if (couponCode) {
            const Coupon = require('../models/Coupon');
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            
            if (coupon) {
                let originalAmountRs = amount / 100;

                // Check Expiry
                if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
                    return res.status(400).json({ success: false, message: 'Coupon has expired' });
                }

                // Check Usage Limit
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
                }

                // Check Min Purchase
                if (coupon.minPurchase && originalAmountRs < coupon.minPurchase) {
                    return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
                }

                let discount = 0;
                if (coupon.discountType === 'percentage') {
                    discount = (originalAmountRs * coupon.discountValue) / 100;
                    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                        discount = coupon.maxDiscount;
                    }
                } else {
                    discount = coupon.discountValue;
                }

                amount = Math.max(0, (originalAmountRs - discount) * 100);
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
            }
        }

        if (!razorpayInstance) {
             return res.status(500).json({ success: false, message: 'Razorpay is not configured on the server.' });
        }

        const options = {
            amount: amount, 
            currency: 'INR',
            receipt: `sub_${studentId}`.substring(0, 40)
        };

        const order = await razorpayInstance.orders.create(options);

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            planTitle: planTitle
        });

    } catch (err) {
        console.error('Error creating subscription order:', err);
        res.status(500).json({ success: false, message: 'Failed to create subscription order', error: err.message });
    }
});

// @route   POST /api/payment/verify-subscription
// @desc    Verify Razorpay payment and activate subscription
// @access  Protected
router.post('/verify-subscription', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            studentId
        } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder';

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update Student Status
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            // Record in Finance
            const Installment = require('../models/Installment');
            const PaymentHistory = require('../models/PaymentHistory');
            const SubscriptionPlan = require('../models/SubscriptionPlan');

            let amount = 0;
            
            // 1. Fetch exact paid amount directly from Razorpay (most secure & accurate)
            if (razorpayInstance) {
                try {
                    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
                    if (paymentDetails && paymentDetails.amount) {
                        amount = paymentDetails.amount / 100; // Razorpay returns in paise, convert to Rs
                    }
                } catch (err) {
                    console.error('Failed to fetch payment details from Razorpay, falling back to manual calculation:', err);
                }
            }

            let plan = null;
            if (req.body.planId) {
                plan = await SubscriptionPlan.findById(req.body.planId);
            }

            // 2. Fallback to manual plan/coupon calculation if Razorpay fetch failed or isn't configured
            if (amount === 0) {
                if (plan) {
                    amount = plan.price;
                }
                
                if (req.body.couponId && amount > 0) {
                    const Coupon = require('../models/Coupon');
                    const coupon = await Coupon.findById(req.body.couponId);
                    if (coupon) {
                        let discount = 0;
                        if (coupon.discountType === 'percentage') {
                            discount = (amount * coupon.discountValue) / 100;
                            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                                discount = coupon.maxDiscount;
                            }
                        } else {
                            discount = coupon.discountValue;
                        }
                        amount = Math.max(0, amount - discount);
                    }
                }
            }

            // Calculate Expiry
            let expiryDate = new Date();
            if (plan) {
                if (plan.type === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
                else if (plan.type === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
                else if (plan.type === 'annually') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                else expiryDate.setMonth(expiryDate.getMonth() + 1); // Default 1 month
            } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1); // Default fallback
            }

            student.isSubscribed = true;
            student.activePlan = plan ? plan._id : null;
            student.planTier = plan ? plan.accessLevel : 'Basic';
            student.subscriptionStartedAt = new Date();
            student.subscriptionExpiresAt = expiryDate;
            
            // Auto-enable core features for subscribed students safely
            if (!student.access) {
                student.access = {};
            }
            const isPremium = ['Full', 'Premium', 'Platinum'].includes(student.planTier);
            student.access.typingPractice = isPremium; // Only Premium gets typing
            student.access.myCourses = true;
            student.access.payments = true;
            student.markModified('access');
            
            await student.save();

            const installment = new Installment({
                student_id: studentId,
                installment_no: 99,
                amount: amount,
                due_date: new Date(),
                paid_date: new Date(),
                status: 'Paid',
                payment_mode: 'Razorpay'
            });
            await installment.save();

            const paymentHistory = new PaymentHistory({
                installment_id: installment._id,
                paid_amount: amount,
                payment_mode: 'Razorpay',
                reference_id: razorpay_payment_id
            });
            await paymentHistory.save();

            // 3. Track Coupon Usage
            if (req.body.couponId) {
                const Coupon = require('../models/Coupon');
                const coupon = await Coupon.findByIdAndUpdate(req.body.couponId, { $inc: { usedCount: 1 } });
                if (coupon) {
                    student.couponCode = coupon.code;
                    await student.save();
                }
            }

            res.status(200).json({ 
                success: true, 
                message: 'Payment verified and recorded.',
                student: student 
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

    } catch (err) {
        console.error('Error verifying subscription payment:', err);
        res.status(500).json({ success: false, message: 'Failed to verify payment', error: err.message });
    }
});

module.exports = router;
