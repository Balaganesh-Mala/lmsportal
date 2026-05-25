const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    sender: {
        type: String,
        enum: ['student', 'admin', 'trainer'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'placement', 'technical', 'fees'],
        default: 'general'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexing for faster history lookup
SupportMessageSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('SupportMessage', SupportMessageSchema);
