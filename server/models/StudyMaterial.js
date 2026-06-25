const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    contentType: {
        type: String,
        enum: ['document', 'video', 'link'],
        default: 'document'
    },
    // URL for uploaded files (PDF, JPG, etc.)
    fileUrl: {
        type: String
    },
    filePublicId: {
        type: String
    },
    // For Google Docs, Drive Links, or External Articles
    linkUrl: {
        type: String
    },
    // YouTube / Vimeo / Direct Video Links
    videoUrl: {
        type: String
    },
    thumbnailUrl: {
        type: String
    },
    thumbnailPublicId: {
        type: String
    },
    targetType: {
        type: String,
        enum: ['global', 'batch', 'individual'],
        default: 'global'
    },
    // Array of Batch IDs if targetType is 'batch'
    targetBatches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    }],
    // Array of Student IDs if targetType is 'individual'
    targetStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    // Security toggle
    isProtected: {
        type: Boolean,
        default: true
    },
    requiredTier: { 
        type: String, 
        enum: ['Basic', 'Premium', 'Gold', 'Platinum', 'Free Trial'], 
        default: 'Basic' 
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexing for faster searching by targets
studyMaterialSchema.index({ targetType: 1 });
studyMaterialSchema.index({ targetBatches: 1 });
studyMaterialSchema.index({ targetStudents: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
