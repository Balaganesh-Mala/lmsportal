const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String
    // required: true // Made optional for now to allow creating topic first then uploading
  },
  videoPublicId: {
    type: String
  },
  description: {
    type: String
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  notes: [{
    url: String,
    publicId: String,
    name: String,
    type: { type: String, enum: ['file', 'google_doc', 'google_ppt'], default: 'file' },
    requiredTier: { type: String, enum: ['Basic', 'Premium', 'Gold', 'Platinum'], default: 'Basic' }
  }],
  order: {
    type: Number,
    required: true
  },
  // Global sequential index for drip unlock (1, 2, 3... across all modules in a course)
  unlockOrder: {
    type: Number,
    default: null
  },
  classDate: {
    type: Date
  },
  requiredTier: { 
    type: String, 
    enum: ['Basic', 'Intermediate', 'Full'], 
    default: 'Basic' 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Topic', TopicSchema);
