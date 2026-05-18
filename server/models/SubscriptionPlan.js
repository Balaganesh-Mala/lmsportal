const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['monthly', 'quarterly', 'annually'] 
    },
    duration: { type: String, required: true }, // e.g., "1 Month", "3 Months"
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discountLabel: { type: String }, // e.g., "21% OFF"
    badge: { type: String }, // e.g., "Most Recommended"
    accessLevel: { 
        type: String, 
        enum: ['Basic', 'Intermediate', 'Full', 'Premium', 'Platinum'], 
        default: 'Basic' 
    },
    
    features: [{
        category: { type: String }, // e.g., "Class", "After Class"
        items: [String]
    }],
    
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SubscriptionPlanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
