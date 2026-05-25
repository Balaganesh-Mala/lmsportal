const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trainerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    role: {
        type: String,
        default: 'Other'
    },
    hiringRounds: {
        mcq: { 
            enabled: { type: Boolean, default: true },
            topic: { type: String, default: '' },
            questionCount: { type: Number, default: 15 },
            instructions: { type: String, default: '' },
            customQuestions: [{
                question: String,
                options: [String],
                correct: String
            }],
            testId: { type: mongoose.Schema.Types.ObjectId, ref: 'HiringTest' }
        },
        video: { 
            enabled: { type: Boolean, default: true },
            question: { type: String, default: '' },
            testId: { type: mongoose.Schema.Types.ObjectId, ref: 'HiringTest' }
        },
        assignment: { 
            enabled: { type: Boolean, default: true },
            question: { type: String, default: '' },
            testId: { type: mongoose.Schema.Types.ObjectId, ref: 'HiringTest' }
        }
    },
    status: {
        type: String,
        enum: ['applicant', 'active', 'rejected', 'hold'],
        default: 'applicant'
    },
    photo: {
        type: String
    },
    bio: {
        type: String
    },
    specialization: {
        type: String
    },
    // For Employee Mode
    assignedBatches: [{
        type: String // or mongoose.Schema.Types.ObjectId if referencing a Batch model
    }],
    assignedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    socialLinks: {
        linkedin: String,
        github: String,
        website: String
    },
    access: {
        dashboard: { type: Boolean, default: true },
        dashboardOverview: { type: Boolean, default: true },
        dashboardFinance: { type: Boolean, default: true },
        dashboardStudents: { type: Boolean, default: true },
        dashboardInquiries: { type: Boolean, default: true },

        studentsManagement: { type: Boolean, default: true },
        studentsList: { type: Boolean, default: true },
        batchStudents: { type: Boolean, default: true },

        coursesLearning: { type: Boolean, default: true },
        courses: { type: Boolean, default: true },
        trainers: { type: Boolean, default: true },
        studyMaterials: { type: Boolean, default: true },

        finance: { type: Boolean, default: false },
        feeManagement: { type: Boolean, default: false },
        subscriptionPlans: { type: Boolean, default: false },
        subscribers: { type: Boolean, default: false },
        coupons: { type: Boolean, default: false },
        expenses: { type: Boolean, default: false },

        marketingWebsite: { type: Boolean, default: false },
        banners: { type: Boolean, default: false },
        spotlights: { type: Boolean, default: false },
        blogs: { type: Boolean, default: false },
        reviews: { type: Boolean, default: false },

        communication: { type: Boolean, default: false },
        supportInbox: { type: Boolean, default: false },
        inquiries: { type: Boolean, default: false },

        settings: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
trainerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
trainerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Trainer', trainerSchema);
