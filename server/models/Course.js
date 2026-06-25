const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title']
    },
    classLevel: {
        type: String,
        default: ''
    },
    overview: {
        type: String,
        required: [true, 'Please add a course overview']
    },
    description: {
        type: String,
        required: [true, 'Please add a short description']
    },
    duration: {
        type: String,
        default: ''
    },
    highlights: {
        type: [String], // Array of strings
        default: []
    },
    syllabus: [{
        title: String,
        modules: [String]
    }],
    fee: {
        type: String, 
        default: ''
    },
    skillLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    isBonus: {
        type: Boolean,
        default: false
    },
    pricingType: {
        type: String,
        enum: ['free', 'coins_only', 'points_only', 'coins_and_points'],
        default: 'free'
    },
    priceCoins: {
        type: Number,
        default: 0
    },
    pricePoints: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String,
        default: 'no-photo.jpg'
    },
    imagePublicId: {
        type: String
    },
    syllabusPdf: {
        url: String,
        publicId: String
    },
    syllabusLink: {
        type: String,
        default: ''
    },
    brochurePdf: {
        url: String,
        publicId: String
    },
    brochureLink: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Course', CourseSchema);
