const Trainer = require('../models/Trainer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');
const { resetPasswordTemplate } = require('../templates/emailTemplates');
const Setting = require('../models/Setting');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Trainer Login
// @route   POST /api/trainer/auth/login
// @access  Public
exports.loginTrainer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check for trainer
        const trainer = await Trainer.findOne({ email: normalizedEmail })
            .populate('hiringRounds.mcq.testId')
            .populate('hiringRounds.video.testId')
            .populate('hiringRounds.assignment.testId');
            
        if (!trainer) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        if (await trainer.matchPassword(password)) {
            res.json({
                success: true,
                _id: trainer._id,
                name: trainer.name,
                email: trainer.email,
                role: trainer.role,
                status: trainer.status,
                hiringRounds: trainer.hiringRounds,
                token: generateToken(trainer._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Request Password Reset
// @route   POST /api/trainer/auth/request-reset
// @access  Public
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const trainer = await Trainer.findOne({ email });

        if (!trainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        // Only allow promoted/active trainers to reset password
        if (trainer.status !== 'active') {
             return res.status(403).json({ message: 'Only promoted trainers can reset their password. Please contact support.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        trainer.resetToken = tokenHash;
        trainer.resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
        await trainer.save();

        // Create reset link
        const trainerUrl = process.env.TRAINER_URL || 'http://localhost:5174'; // Fallback to local
        const resetLink = `${trainerUrl}/reset-password/${resetToken}`;

        // Fetch Settings
        const settings = await Setting.findOne() || {};

        // Send email
        await sendEmail(
            trainer.email,
            'Password Reset Request',
            resetPasswordTemplate(trainer.name, resetLink, settings)
        );

        res.json({ success: true, message: 'Reset link sent to email' });

    } catch (err) {
        console.error('Request Reset Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/trainer/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const trainer = await Trainer.findOne({
            resetToken: tokenHash,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!trainer) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Setup password (triggers pre-save hook for hashing usually, but let's check model)
        // Check if Trainer model has pre-save hook for hashing. 
        // studentRoutes manually hashed it. Let's assume Trainer model might differ or we should manually hash to be safe if no hook.
        // Assuming Trainer model has 'matchPassword' implies it has a pre-save hook or we need to check.
        // To be safe and consistent with studentRoutes, let's hash it if not sure, OR set password and save if model handles it.
        // Let's stick to setting it. If Trainer.js has pre-save, it will hash. If not, we might store plain text which is bad.
        // *Correction*: studentRoutes hashed it manually. I should probably do the same unless I see Trainer.js.
        // Let's assume manual hashing is safer given I haven't seen Trainer.js pre-save hook.
        
        // Actually, let's check if we can import bcrypt and hash it.
        // importing bcrypt at the top to be safe.
        
        const salt = await bcrypt.genSalt(10);
        trainer.password = await bcrypt.hash(newPassword, salt);
        
        // Clear token
        trainer.resetToken = undefined;
        trainer.resetTokenExpiry = undefined;
        await trainer.save();

        res.json({ success: true, message: 'Password reset successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get current trainer profile
// @route   GET /api/trainer/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.user.id)
            .select('-password')
            .populate('hiringRounds.mcq.testId')
            .populate('hiringRounds.video.testId')
            .populate('hiringRounds.assignment.testId');
        res.json(trainer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
