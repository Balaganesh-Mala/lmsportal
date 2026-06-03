const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Setting = require('../models/Setting'); // Import Settings Model
const { sendEmail } = require('../utils/emailService');
const { studentRegistrationTemplate, resetPasswordTemplate } = require('../templates/emailTemplates');
const crypto = require('crypto');
const { getStudentDashboardStats, getLeaderboard, getStudentActivity, getInterviewLeaderboard } = require('../controllers/dashboardController');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const FeeStructure = require('../models/FeeStructure');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Installment = require('../models/Installment');
const BatchStudent = require('../models/BatchStudent');
const Batch = require('../models/Batch');

// Configure Multer
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true
        });
        fs.unlinkSync(filePath);
        return result;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
    }
};

// ... (other routes)

// @route   GET /api/students/check-email
// @desc    Check if email already exists
// @access  Public
router.get('/check-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        const student = await Student.findOne({ email: email.toLowerCase() });
        if (student) {
            return res.json({ success: true, exists: true });
        }
        res.json({ success: true, exists: false });
    } catch (err) {
        console.error('Check Email Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/students/login
// @desc    Login student
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check for user
        const student = await Student.findOne({ email: normalizedEmail });
        if (!student) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, student.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (student.status !== 'Active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // Generate Token
        const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        
        // Return user data (excluding password)
        res.json({
            success: true,
            token,
            user: {
                _id: student._id,
                name: student.name,
                email: student.email,
                access: student.access,
                courseName: student.courseName,
                status: student.status,
                trialEndsAt: student.trialEndsAt,
                isSubscribed: student.isSubscribed,
                activePlan: student.activePlan,
                planTier: student.planTier,
                subscriptionStartedAt: student.subscriptionStartedAt,
                subscriptionExpiresAt: student.subscriptionExpiresAt
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/students/register
// @desc    Register a new student
// @access  Public
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    try {
        const { 
            firstName, lastName, email, phone, gender, dob, address, city, district, collegeName,
            batchId, password
        } = req.body;
        
        const name = `${firstName} ${lastName}`.trim();

        const normalizedEmail = email.toLowerCase().trim();

        // Check if student exists
        let student = await Student.findOne({ email: normalizedEmail });
        if (student) {
            return res.status(400).json({ success: false, message: 'Student with this email already exists' });
        }

        let profilePictureUrl = "";
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.path, 'student_profiles');
                profilePictureUrl = result.secure_url;
            } catch (uploadErr) {
                console.error("Cloudinary Upload Error during Register:", uploadErr);
            }
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Calculate 10 days from now for trial
        const trialEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

        let courseName = "";
        let courseCategory = "";
        let courseIdValue = null;

        // If batch is selected, fetch batch details to get course info
        if (batchId) {
            const batch = await Batch.findById(batchId).populate('courses');
            if (batch && batch.courses && batch.courses.length > 0) {
                const primaryCourse = batch.courses[0];
                courseIdValue = primaryCourse._id;
                courseName = primaryCourse.title;
                courseCategory = primaryCourse.category;
            }
        }

        // Create Student
        student = new Student({
            name,
            email: normalizedEmail,
            phone,
            gender,
            dob,
            address,
            city,
            district,
            collegeName,
            courseName,
            courseCategory,
            passwordHash,
            profilePicture: profilePictureUrl,
            status: 'Active',
            trialEndsAt,
            isSubscribed: false
        });

        await student.save();

        // Assign to Batch
        if (batchId && courseIdValue) {
            const batchStudent = new BatchStudent({
                batchId,
                courseId: courseIdValue,
                studentId: student._id,
                enrollmentDate: new Date()
            });
            await batchStudent.save();
        }

        // Generate Token
        const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
        
        res.status(201).json({
            success: true,
            token,
            user: {
                _id: student._id,
                name: student.name,
                email: student.email,
                access: student.access,
                courseName: student.courseName,
                status: student.status,
                trialEndsAt: student.trialEndsAt,
                isSubscribed: student.isSubscribed,
                activePlan: student.activePlan,
                planTier: student.planTier,
                subscriptionStartedAt: student.subscriptionStartedAt,
                subscriptionExpiresAt: student.subscriptionExpiresAt
            }
        });

    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/students/request-reset
// @desc    Request password reset
// @access  Public
router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        student.resetToken = tokenHash;
        student.resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
        await student.save();

        // Create reset link pointing exactly to the student portal (normally port 5174)
        const studentUrl = process.env.STUDENT_URL || 'http://localhost:5174';
        const resetLink = `${studentUrl}/reset-password/${resetToken}`;

        // Fetch Settings
        const settings = await Setting.findOne() || {};

        // Check if email service is configured
        if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
            console.error('Email service not configured properly');
            return res.status(500).json({ message: 'Email service not configured on server' });
        }

        // Send email
        await sendEmail(
            student.email,
            'Password Reset Request',
            resetPasswordTemplate(student.name, resetLink, settings)
        );

        res.json({ success: true, message: 'Reset link sent to email' });

    } catch (err) {
        console.error('❌ Request Reset Error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server Error during password reset request', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   POST /api/students/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const student = await Student.findOne({
            resetToken: tokenHash,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!student) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        student.passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Clear token
        student.resetToken = undefined;
        student.resetTokenExpiry = undefined;
        await student.save();

        res.json({ success: true, message: 'Password reset successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/students/create
// @desc    Create a new student, generate password, and send email
// @access  Admin
router.post('/create', upload.single('profilePicture'), async (req, res) => {
    try {
        const { 
            name, email, phone, gender, dob, address, city, 
            courseName, courseCategory, batchTiming, startDate, 
            access 
        } = req.body;
        
        let profilePictureUrl = "";

        // Handle File Upload if present
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.path, 'student_profiles');
                profilePictureUrl = result.secure_url;
            } catch (uploadErr) {
                console.error("Cloudinary Upload Error during Create:", uploadErr);
                // Continue without pic or return error? Let's just log and continue for now.
            }
        }
        
        // Parse access if it's a string (FormData sends objects as strings)
        let parsedAccess = access;
        if (typeof access === 'string') {
            try {
                parsedAccess = JSON.parse(access);
            } catch (e) {
                console.error("Error parsing access in create:", e);
            }
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if student exists
        let student = await Student.findOne({ email: normalizedEmail });
        if (student) {
            return res.status(400).json({ message: 'Student with this email already exists' });
        }

        // Generate Password: name + 4 random digits
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const plainPassword = `${firstName}${randomDigits}`;

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(plainPassword, salt);

        // Create Student
        student = new Student({
            name,
            email: normalizedEmail,
            phone,
            gender,
            dob,
            address,
            city,
            courseName,
            courseCategory,
            batchTiming,
            startDate,
            access: parsedAccess, // Object containing boolean flags
            passwordHash,
            profilePicture: profilePictureUrl,
            status: 'Active'
        });

        await student.save();
        console.log(`Student created: ${student.email}`);



        // Fetch Global Settings for Branding
        let settings = {};
        try {
            settings = await Setting.findOne() || {};
            console.log('Settings fetched for email branding');
        } catch (settingErr) {
            console.error('Error fetching settings (using defaults):', settingErr);
        }

        let emailSent = false;
        let emailErrorMsg = null;
        try {
            console.log(`Attempting to send registration email to ${email}...`);
            await sendEmail(
                email,
                `Welcome to ${settings.siteTitle || 'Wonew Skill Up Academy'} - Student Portal Login`,
                studentRegistrationTemplate(name, email, plainPassword, settings)
            );
            console.log('Registration email sent successfully.');
            emailSent = true;
        } catch (emailErr) {
            console.error('FAILED to send registration email:', emailErr);
            emailErrorMsg = emailErr.message || 'Unknown email error';
        }

        res.status(201).json({ 
            success: true, 
            message: emailSent ? 'Student created and email sent successfully!' : 'Student created, BUT email failed to send.', 
            emailStatus: emailSent ? 'sent' : 'failed',
            emailError: emailErrorMsg,
            student: { ...student._doc, passwordHash: undefined } 
        });

    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/students/leaderboard
// @desc    Get student leaderboard
// @access  Public
router.get('/leaderboard', getLeaderboard);


// @route   GET /api/students/leaderboard/interviews
// @desc    Get mock interview leaderboard (Batch-based)
// @access  Public
router.get('/leaderboard/interviews', getInterviewLeaderboard);

// @route   GET /api/students/subscribers
// @desc    Get all students with active or expired subscriptions
// @access  Admin
router.get('/subscribers', async (req, res) => {
    try {
        const students = await Student.find({ 
            $or: [
                { isSubscribed: true },
                { planTier: { $ne: 'None' } }
            ]
        })
        .select('name email phone activePlan planTier subscriptionStartedAt subscriptionExpiresAt isSubscribed status')
        .populate('activePlan', 'title type duration price accessLevel')
        .sort({ subscriptionExpiresAt: -1 })
        .lean();

        res.json(students);
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/students/update-subscription/:id
// @desc    Manually update student subscription
// @access  Admin
router.put('/update-subscription/:id', async (req, res) => {
    try {
        const { planId, tier, expiresAt, isSubscribed } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (planId !== undefined) student.activePlan = planId || null;
        if (tier !== undefined) student.planTier = tier;
        if (expiresAt !== undefined) student.subscriptionExpiresAt = expiresAt;
        if (isSubscribed !== undefined) student.isSubscribed = isSubscribed;

        if (isSubscribed && !student.subscriptionStartedAt) {
            student.subscriptionStartedAt = new Date();
        }

        student.updatedAt = Date.now();
        await student.save();

        res.json({ success: true, message: 'Subscription updated successfully', student });
    } catch (err) {
        console.error('Error updating subscription:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/students/list
// @desc    Get all students
// @access  Admin
router.get('/list', async (req, res) => {
    try {
        const students = await Student.find()
            .select('-passwordHash') // Exclude password
            .sort({ createdAt: -1 })
            .lean();

        const studentsWithFees = await Promise.all(students.map(async (student) => {
            // 1. Fetch Batch Assignments (Always do this first)
            const batchAssignments = await BatchStudent.find({ 
                studentId: new mongoose.Types.ObjectId(student._id) 
            })
            .populate('batchId', 'name')
            .lean();
            
            const batchNames = batchAssignments.map(ba => ba.batchId?.name).filter(Boolean);

            const studentWithBatch = {
                ...student,
                batchName: batchNames[0] || null,
                batchNames: batchNames
            };

            // 2. Fetch Fee Data
            const feeStructure = await FeeStructure.findOne({ student_id: student._id }).lean();
            if (!feeStructure) {
                return { ...studentWithBatch, feeDetails: null };
            }

            // 3. Fetch Installments for detailed breakdown
            const installments = await Installment.find({ student_id: student._id }).lean();
            
            let paidAmount = 0;
            let pendingAmount = 0;
            let paidInstallments = 0;
            let overdueInstallments = 0;

            installments.forEach(inst => {
                if (inst.status === 'Paid') {
                    paidAmount += inst.amount;
                    paidInstallments++;
                } else if (inst.status === 'Overdue') {
                    pendingAmount += inst.amount;
                    overdueInstallments++;
                } else {
                    // Pending
                    pendingAmount += inst.amount;
                }
            });

            return {
                ...studentWithBatch,
                feeDetails: {
                    totalFee: feeStructure.total_fee,
                    totalInstallments: feeStructure.total_installments,
                    paidAmount,
                    pendingAmount,
                    paidInstallments,
                    overdueInstallments,
                    installments
                }
            };
        }));

        res.json(studentsWithFees);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});



// @route   PUT /api/students/profile/:id
// @desc    Update student profile (Self Update)
// @access  Student
router.put('/profile/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        const { headline, bio, socials, education, preferences } = req.body;
        let profilePictureUrl = null;

        // Handle File Upload
        if (req.file) {
            const result = await uploadToCloudinary(req.file.path, 'student_profiles');
            profilePictureUrl = result.secure_url;
        }

        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Update Fields
        if (headline) student.headline = headline;
        if (bio) student.bio = bio;
        if (profilePictureUrl) student.profilePicture = profilePictureUrl;

        // Parse and update nested objects
        if (socials) {
            try {
                const parsedSocials = typeof socials === 'string' ? JSON.parse(socials) : socials;
                student.socials = { ...student.socials, ...parsedSocials };
            } catch (e) {
                console.error("Error parsing socials:", e);
            }
        }

        if (education) {
            try {
                const parsedEducation = typeof education === 'string' ? JSON.parse(education) : education;
                student.education = parsedEducation;
            } catch (e) {
                console.error("Error parsing education:", e);
            }
        }

        if (preferences) {
            student.preferences = { ...student.preferences, ...preferences };
        }

        student.updatedAt = Date.now();
        await student.save();

        res.json({ 
            success: true, 
            message: 'Profile updated successfully', 
            user: {
                 _id: student._id,
                 name: student.name,
                 email: student.email,
                 profilePicture: student.profilePicture, // Return updated pic
                 headline: student.headline,
                 bio: student.bio,
                 socials: student.socials,
                 education: student.education,
                 preferences: student.preferences
            }
        });

    } catch (err) {
        console.error('Profile Update Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/students/update/:id
// @desc    Update student details
// @access  Admin
router.put('/update/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        const { 
            name, phone, gender, dob, address, city, 
            courseName, courseCategory, batchTiming, startDate, 
            access, status 
        } = req.body;

        let profilePictureUrl = null;

        // Handle File Upload if present
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.path, 'student_profiles');
                profilePictureUrl = result.secure_url;
            } catch (uploadErr) {
                console.error("Cloudinary Upload Error during Update:", uploadErr);
            }
        }

        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Parse access if it's a string
        let parsedAccess = access;
        if (typeof access === 'string') {
            try {
                parsedAccess = JSON.parse(access);
            } catch (e) {
                console.error("Error parsing access in update:", e);
            }
        }

        // Update fields
        student.name = name || student.name;
        student.phone = phone || student.phone;
        student.gender = gender || student.gender;
        student.dob = dob || student.dob;
        student.address = address || student.address;
        student.city = city || student.city;
        if (profilePictureUrl) student.profilePicture = profilePictureUrl;
        
        student.courseName = courseName || student.courseName;
        student.courseCategory = courseCategory || student.courseCategory;
        student.batchTiming = batchTiming || student.batchTiming;
        student.startDate = startDate || student.startDate;
        
        if (parsedAccess) {
            student.access = parsedAccess;
            student.markModified('access');
        }
        if (status) student.status = status;

        // Password Update Logic
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            student.passwordHash = await bcrypt.hash(req.body.password, salt);
        }

        student.updatedAt = Date.now();
        await student.save();

        res.json({ 
            success: true, 
            message: 'Student updated successfully', 
            student: { ...student._doc, passwordHash: undefined } 
        });

    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/students/bulk-status
// @desc    Update status for multiple students
// @access  Admin
router.put('/bulk-status', async (req, res) => {
    try {
        const { studentIds, status } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || !status) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        await Student.updateMany(
            { _id: { $in: studentIds } },
            { $set: { status, updatedAt: Date.now() } }
        );
        res.json({ success: true, message: `Status updated to ${status} for ${studentIds.length} students` });
    } catch (err) {
        console.error('Bulk Status Update Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Cascade Delete all related records
        await BatchStudent.deleteMany({ studentId: student._id });
        
        // Find fee structure to delete its installments too
        const fsRec = await FeeStructure.findOne({ student_id: student._id });
        if (fsRec) {
            await Installment.deleteMany({ fee_structure_id: fsRec._id });
            await fsRec.deleteOne();
        }

        // Delete any learning progress
        await Progress.deleteMany({ studentId: student._id });

        await student.deleteOne();
        res.json({ message: 'Student and all related records deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});



// @route   GET /api/students/leaderboard
// @desc    Get student leaderboard
// @access  Public


// @route   GET /api/students/dashboard/:studentId
// @desc    Get student dashboard stats
// @access  Student
router.get('/dashboard/:studentId', getStudentDashboardStats);

// @route   GET /api/students/activity/:studentId?range=week|month|year
// @desc    Get time-range learning activity for dashboard chart
// @access  Student
router.get('/activity/:studentId', getStudentActivity);

// @route   GET /api/students/:id
// @desc    Get single student by ID
// @access  Admin/Student
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-passwordHash');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/progress/stats/:studentId
// @desc    Get Student Course Progress Stats (For Job Eligibility)
// @access  Public (or protected if middleware added)
router.get('/progress/stats/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check Enrollment
        if (!student.courseName) {
            return res.json({ 
                success: true, 
                stats: { 
                    enrolled: false, 
                    completionPercentage: 0 
                } 
            });
        }

        // Find the Course - Try Exact Match First (Like Trainer Portal)
        let course = await Course.findOne({ title: student.courseName });
        
        // Fallback to Regex if Exact Match Fails (Case Insensitive)
        if (!course) {
             course = await Course.findOne({ 
                title: { $regex: new RegExp(`^${student.courseName}$`, 'i') } 
            });
        }

        if (!course) {
             console.log(`Course not found for name: "${student.courseName}"`);
             return res.json({ 
                success: true, 
                stats: { 
                    enrolled: false, 
                    completionPercentage: 0 
                } 
            });
        }

        // Calculate Total Topics for this Course
        const modules = await Module.find({ courseId: course._id }).select('_id');
        const moduleIds = modules.map(m => m._id);
        const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });

        // Calculate Completed Topics for this Student in this Course
        const completedTopics = await Progress.countDocuments({ 
            studentId: student._id, 
            courseId: course._id, 
            completed: true 
        });

        // Calculate Percentage
        let percentage = 0;
        if (totalTopics > 0) {
            percentage = Math.round((completedTopics / totalTopics) * 100);
        }
        
        // Cap at 100
        percentage = Math.min(percentage, 100);

        console.log(`Stats for ${student.name}: Course "${course.title}", Progress ${percentage}% (${completedTopics}/${totalTopics})`);

        res.json({
            success: true,
            stats: {
                enrolled: true,
                completionPercentage: percentage,
                courseName: course.title
            }
        });

    } catch (err) {
        console.error("Error calculating progress stats:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/students/change-password/:id
// @desc    Change student password (Self-Service)
// @access  Student
router.post('/change-password/:id', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        const student = await Student.findById(req.params.id);

        if (!student) {
            console.warn(`Change password attempt for non-existent student ID: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Student account not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, student.passwordHash);
        if (!isMatch) {
            console.log(`Failed password change attempt for student: ${student.email} (Incorrect current password)`);
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        student.passwordHash = await bcrypt.hash(newPassword, salt);
        student.updatedAt = Date.now();
        await student.save();

        console.log(`Password successfully updated for student: ${student.email}`);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change Password Error:', err);
        res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
    }
});

module.exports = router;
