const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Defensive: Handle case where 'null' or 'undefined' string is sent
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ message: 'Not authorized, invalid token format' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Try to find in Trainer first
            let user = await Trainer.findById(decoded.id).select('-password');
            
            // If not found in Trainer, check Admin
            if (!user) {
                user = await Admin.findById(decoded.id).select('-password');
            }

            // If still not found, check Student
            if (!user) {
                user = await Student.findById(decoded.id).select('-passwordHash');
                if (user) user.role = 'Student'; // Assign role for consistency
            }

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Status Check: Block access if rejected or on hold (Only for Trainers)
            if (user.role !== 'Admin' && (user.status === 'rejected' || user.status === 'hold')) {
                return res.status(403).json({ message: 'Access denied. Account is deactivated.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

exports.admin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.status === 'active')) { 
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as admin' });
    }
};
