const mongoose = require('mongoose');

const StudentMCQAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HiringTest',
        required: true
    },
    // Student's selected answers per question
    answers: [{
        questionId: { type: String, required: true }, // question index as string
        selected: [{ type: String }]                   // selected option(s)
    }],
    score: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    attemptedAt: {
        type: Date,
        default: Date.now
    }
});

// One attempt per student per topic per test (can be updated on re-attempt if needed)
StudentMCQAttemptSchema.index({ studentId: 1, topicId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('StudentMCQAttempt', StudentMCQAttemptSchema);
