const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true 
    },
    discountType: { 
        type: String, 
        required: true, 
        enum: ['percentage', 'flat'] 
    },
    discountValue: { 
        type: Number, 
        required: true 
    },
    minPurchase: { 
        type: Number, 
        default: 0 
    },
    maxDiscount: { 
        type: Number 
    }, // Useful for percentage discounts
    expiryDate: { 
        type: Date 
    },
    usageLimit: { 
        type: Number 
    },
    usedCount: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Coupon', CouponSchema);
