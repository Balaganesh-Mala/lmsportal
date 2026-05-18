const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema({
  // Personal Details
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  gender: { type: String },
  dob: { type: Date },

  address: { type: String },
  city: { type: String },
  district: { type: String },
  collegeName: { type: String },

  // Course Details
  courseName: { type: String },
  courseCategory: { type: String },
  batchTiming: { type: String }, // e.g., "Morning", "Evening"
  startDate: { type: Date },
  progress: { type: Number, default: 0 }, // Overall course progress percentage
  points: { type: Number, default: 0 },
  typingLevel: { type: Number, default: 1 },
  lastCategory: { type: String, default: 'beginner' },
  lastLessonIndex: { type: Number, default: 0 },
  
  // Streak System
  currentStreak: { type: Number, default: 0 },
  highestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },

  // Feature Access Controls
  access: {
    dashboard: { type: Boolean, default: true },
    myCourses: { type: Boolean, default: true },
    myQR: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    typingPractice: { type: Boolean, default: false },
    aiMockInterview: { type: Boolean, default: false },
    profile: { type: Boolean, default: true },
    settings: { type: Boolean, default: true },
    payments: { type: Boolean, default: true },
    jobs: { type: Boolean, default: true }
  },

  // Account Status
  status: { 
    type: String, 
    default: "Active",
    enum: ["Active", "Inactive", "Graduated", "Suspended"] 
  },

  // Trial & Subscription
  trialEndsAt: { type: Date },
  isSubscribed: { type: Boolean, default: false },
  activePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  subscriptionStartedAt: { type: Date },
  subscriptionExpiresAt: { type: Date },
  planTier: { 
    type: String, 
    enum: ['Basic', 'Intermediate', 'Full', 'Premium', 'Platinum', 'None'], 
    default: 'None' 
  },

  // Authentication
  passwordHash: { type: String }, // For direct portal login
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  supabaseId: { type: String }, // Keep for backward compatibility if needed

  // Profile Details (New)
  profilePicture: { type: String, default: "" },
  headline: { type: String, default: "" },
  bio: { type: String, default: "" },
  
  socials: {
    linkedin: { type: String, default: "" },
    naukri: { type: String, default: "" },
    instagram: { type: String, default: "" }
  },

  certifications: [{
    name: { type: String },
    organization: { type: String },
    year: { type: String }
  }],

  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: String }
  }],

  preferences: {
    emailUpdates: { type: Boolean, default: true },
    newCourseAlerts: { type: Boolean, default: false },
    assignmentNotifs: { type: Boolean, default: true },
    showOnLeaderboard: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: true },
    typingSounds: { type: Boolean, default: true },
    compactMode: { type: Boolean, default: false }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);
