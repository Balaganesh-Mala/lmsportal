const mongoose = require('mongoose');

const BatchStudentSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },

    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    },
    isBonus: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// A student can only be in a batch once
BatchStudentSchema.index({ studentId: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model('BatchStudent', BatchStudentSchema);
