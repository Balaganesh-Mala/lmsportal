const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/authMiddleware');

const Trainer = require('../models/Trainer');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check for Admin
        let admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
        let isTrainer = false;
        let userRole = 'Admin';
        let userAccess = null;

        if (!admin) {
            // Check for Trainer / Sub-Admin (must be active status)
            admin = await Trainer.findOne({ email: normalizedEmail, status: 'active' });
            if (!admin) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            isTrainer = true;
            userRole = admin.role || 'Sub-Admin';
            userAccess = admin.access;
        }

        // Check password
        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create Token
        const token = jwt.sign({ id: admin._id, role: userRole }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            success: true,
            token,
            user: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: userRole,
                access: userAccess
            }
        });
    } catch (err) {
        console.error('Admin Login Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get current admin profile
// @route   GET /api/admin/me
// @access  Private/Admin
router.get('/me', protect, admin, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (err) {
        console.error('Admin Me Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Initial Setup: Create first admin if none exists
// @route   POST /api/admin/setup
// @access  Public (Only works if no admins exist)
router.post('/setup', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(400).json({ message: 'Setup already completed. Initial admin exists.' });
        }

        const { name, email, password } = req.body;

        const admin = await Admin.create({
            name: name || 'Finwise Admin',
            email: email || 'admin@finwisecareers.com',
            password: password || 'Admin@123'
        });

        res.status(201).json({
            success: true,
            message: 'Initial admin created successfully',
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (err) {
        console.error('Admin Setup Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { resetPasswordTemplate } = require('../templates/emailTemplates');
const Setting = require('../models/Setting');

// @desc    Request Admin password reset
// @route   POST /api/admin/request-reset
// @access  Public
router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        admin.resetToken = tokenHash;
        admin.resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 mins
        await admin.save();

        // Create reset link
        const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
        const resetLink = `${adminUrl}/update-password/${resetToken}`;

        // Fetch Settings for branding
        const settings = await Setting.findOne() || {};

        // Send email
        await sendEmail(
            admin.email,
            'Admin Password Reset Request',
            resetPasswordTemplate(admin.name, resetLink, settings)
        );

        res.json({ success: true, message: 'Reset link sent to email' });
    } catch (err) {
        console.error('Admin Request Reset Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Reset Admin password
// @route   POST /api/admin/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const admin = await Admin.findOne({
            resetToken: tokenHash,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Update password
        admin.password = newPassword;
        admin.resetToken = undefined;
        admin.resetTokenExpiry = undefined;
        await admin.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error('Admin Reset Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
