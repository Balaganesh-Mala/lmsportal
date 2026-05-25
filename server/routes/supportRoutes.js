const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');

// @route   GET /api/support/unread-count
// @desc    Get total unread support messages count for admin
router.get('/unread-count', async (req, res) => {
    try {
        const count = await SupportMessage.countDocuments({ sender: { $ne: 'admin' }, isRead: false });
        res.json({ unreadCount: count });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/support/unread-count/:studentId
// @desc    Get total unread support messages count for a specific student or trainer
router.get('/unread-count/:studentId', async (req, res) => {
    try {
        const count = await SupportMessage.countDocuments({ student: req.params.studentId, sender: 'admin', isRead: false });
        res.json({ unreadCount: count });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/support/read-student/:studentId
// @desc    Mark admin messages as read for a specific student or trainer
router.put('/read-student/:studentId', async (req, res) => {
    try {
        await SupportMessage.updateMany(
            { student: req.params.studentId, sender: 'admin', isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ msg: 'Admin messages marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



// @route   GET /api/support/history/:studentId
// @desc    Get chat history for a specific student or trainer
router.get('/history/:studentId', async (req, res) => {
    try {
        const messages = await SupportMessage.find({ student: req.params.studentId })
            .sort({ createdAt: 1 })
            .limit(100);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/support/active-chats
// @desc    Get list of students and trainers with active chat history (Admin)
router.get('/active-chats', async (req, res) => {
    try {
        const activeChats = await SupportMessage.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$student",
                    lastMessage: { $first: "$message" },
                    lastSender: { $first: "$sender" },
                    category: { $first: "$category" },
                    timestamp: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: { $cond: [{ $and: [{ $ne: ["$sender", "admin"] }, { $eq: ["$isRead", false] }] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            {
                $lookup: {
                    from: 'trainers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'trainerInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    lastSender: 1,
                    category: 1,
                    timestamp: 1,
                    unreadCount: 1,
                    studentInfo: {
                        $cond: {
                            if: { $gt: [{ $size: "$studentInfo" }, 0] },
                            then: { $arrayElemAt: ["$studentInfo", 0] },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: "$trainerInfo" }, 0] },
                                    then: { $arrayElemAt: ["$trainerInfo", 0] },
                                    else: null
                                }
                            }
                        }
                    }
                }
            },
            { $match: { studentInfo: { $ne: null } } },
            { $sort: { timestamp: -1 } }
        ]);
        res.json(activeChats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/support/read/:studentId
// @desc    Mark messages as read for a student or trainer
router.put('/read/:studentId', async (req, res) => {
    try {
        await SupportMessage.updateMany(
            { student: req.params.studentId, sender: { $ne: 'admin' }, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ msg: 'Messages marked as read' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/support/end-chat/:studentId
// @desc    Delete chat history (Admin)
router.delete('/end-chat/:studentId', async (req, res) => {
    try {
        await SupportMessage.deleteMany({ student: req.params.studentId });
        res.json({ success: true, message: 'Chat history deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
