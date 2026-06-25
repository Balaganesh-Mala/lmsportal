const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: 'Smart Aspirants'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  contact: {
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: 'support@smartaspirants.com' },
    address: { type: String, default: '' }
  },
  socials: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  hiringRounds: {
    mcq: { type: Boolean, default: true },
    video: { type: Boolean, default: true },
    assignment: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
