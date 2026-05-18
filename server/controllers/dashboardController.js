const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Attendance = require('../models/Attendance');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const BatchStudent = require('../models/BatchStudent');
const MockInterviewFeedback = require('../models/MockInterviewFeedback');
const TypingHistory = require('../models/TypingHistory');
const TypingProgress = require('../models/TypingProgress');
const Transaction = require('../models/Transaction');

// @desc    Get Student Dashboard Statistics
// @route   GET /api/students/dashboard/:studentId
// @access  Student
exports.getStudentDashboardStats = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Fetch Student Details
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // ─── 1.5. Daily Streak Calculation (Timezone & Calendar Proof) ───────────
        const today = new Date();
        let streakUpdated = false;

        if (!student.lastActiveDate) {
            student.currentStreak = 1;
            student.highestStreak = 1;
            student.lastActiveDate = today;
            streakUpdated = true;
        } else {
            const lastActive = new Date(student.lastActiveDate);
            
            // Calculate absolute difference in calendar days (UTC-normalized dates)
            const d1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const d2 = Date.UTC(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
            const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day: Increase streak!
                student.currentStreak = (student.currentStreak || 0) + 1;
                if (student.currentStreak > (student.highestStreak || 0)) {
                    student.highestStreak = student.currentStreak;
                }
                student.lastActiveDate = today;
                streakUpdated = true;
            } else if (diffDays > 1) {
                // Missed a day: Reset streak to 1
                student.currentStreak = 1;
                student.lastActiveDate = today;
                streakUpdated = true;
            }
            // If diffDays === 0, it means same calendar day - keep streak!
        }
        
        if (streakUpdated) {
            await student.save();
        }

        // ─── 2. Enrolled Courses Count ───────────────────────────────────────────
        // Count unique courseIds across all Progress records (reliable — no string matching)
        const distinctCourseIds = await Progress.distinct('courseId', { studentId });
        const enrolledCoursesCount = distinctCourseIds.length || (student.courseName ? 1 : 0);

        // ─── 3. Hours Learned (use topic.duration, NOT watchedDuration) ──────────
        // watchedDuration is 0 for YouTube embeds and manually-marked topics.
        // Instead, sum the duration (minutes) of all completed topics and convert to hours.
        const completedProgress = await Progress.find({ studentId, completed: true })
            .populate({ path: 'topicId', select: 'duration title' })
            .populate({ path: 'courseId', select: 'title' });

        const totalMinutes = completedProgress.reduce((acc, p) => {
            return acc + (p.topicId?.duration || 0);
        }, 0);
        const hoursLearned = (totalMinutes / 60).toFixed(1);

        // ─── 4. Attendance Count ─────────────────────────────────────────────────
        const attendanceCount = await Attendance.countDocuments({
            studentId: studentId,
            status: 'present'
        });

        // ─── 5. Recent Activity (Last 5 completed topics) ────────────────────────
        // Sort by completedAt desc; fall back to updatedAt if completedAt is null
        const recentProgress = await Progress.find({ studentId, completed: true })
            .sort({ completedAt: -1, updatedAt: -1 })
            .limit(5)
            .populate({ path: 'topicId', select: 'title' })
            .populate({ path: 'courseId', select: 'title' });

        const recentActivity = recentProgress.map(p => ({
            id: p._id,
            topic: p.topicId?.title || 'Unknown Topic',
            course: p.courseId?.title || student.courseName || 'Course',
            date: p.completedAt || p.updatedAt
        }));

        // ─── 6. Batch Progress (% of topics completed) ───────────────────────────
        // Use BatchStudent for reliable course lookup instead of courseName regex.
        let batchProgress = 0;
        try {
            // Try BatchStudent first (reliable)
            // 1. Get Enrollments (Prioritize primary batch)
            const enrollments = await BatchStudent.find({ studentId }).populate('batchId');
            
            // Find primary enrollment (where isBonus is false), fallback to first enrollment if none marked as non-bonus
            const batchStudent = enrollments.find(e => !e.isBonus) || enrollments[0];
            
            let courseIdsToTrack = [];

            // If we have a batch with courses, track all courses in that batch
            if (batchStudent && batchStudent.batchId && batchStudent.batchId.courses) {
                courseIdsToTrack = batchStudent.batchId.courses;
            } else if (distinctCourseIds.length > 0) {
                // Fallback: use Progress distinct courseIds
                courseIdsToTrack = distinctCourseIds;
            } else if (student.courseName) {
                // Last resort fallback: courseName string match
                const course = await Course.findOne({
                    title: { $regex: new RegExp(student.courseName, 'i') }
                });
                if (course) courseIdsToTrack.push(course._id);
            }

            if (courseIdsToTrack.length > 0) {
                const modules = await Module.find({ courseId: { $in: courseIdsToTrack } }).select('_id');
                const moduleIds = modules.map(m => m._id);
                const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });
                const completedTopics = await Progress.countDocuments({
                    studentId,
                    courseId: { $in: courseIdsToTrack },
                    completed: true
                });
                if (totalTopics > 0) {
                    batchProgress = Math.min(100, Math.round((completedTopics / totalTopics) * 100));
                }
            }
        } catch (batchErr) {
            console.error('Batch progress calculation error:', batchErr);
        }

        // ─── 7. Weekly Activity Chart (Points & Coins) ───────────────────────────
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day; // Adjust to Sunday (start of the week)
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const sId = new mongoose.Types.ObjectId(studentId);

        const [weeklyProgressDocs, weeklyTypingHistoryDocs, weeklyTypingProgressDocs, weeklyAttendanceDocs, weeklyMockDocs] = await Promise.all([
            Progress.find({
                studentId: sId,
                completed: true,
                updatedAt: { $gte: startOfWeek }
            }).lean(),
            TypingHistory.find({
                studentId: sId,
                createdAt: { $gte: startOfWeek }
            }).lean(),
            TypingProgress.find({
                studentId: sId,
                createdAt: { $gte: startOfWeek }
            }).lean(),
            Attendance.find({
                studentId: sId,
                method: 'qr',
                status: 'present',
                date: { $gte: startOfWeek }
            }).lean(),
            MockInterviewFeedback.find({
                studentId: sId,
                isSubmitted: true,
                $or: [
                    { interviewDate: { $gte: startOfWeek } },
                    { createdAt: { $gte: startOfWeek } }
                ]
            }).lean()
        ]);

        const dayNamesMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityMap = {
            Mon: { points: 0, coins: 0 },
            Tue: { points: 0, coins: 0 },
            Wed: { points: 0, coins: 0 },
            Thu: { points: 0, coins: 0 },
            Fri: { points: 0, coins: 0 },
            Sat: { points: 0, coins: 0 },
            Sun: { points: 0, coins: 0 }
        };

        const processWeeklyDoc = (doc, pVal, cVal) => {
            const dateVal = doc.interviewDate || doc.date || doc.createdAt || doc.updatedAt || doc.completedAt;
            if (!dateVal) return;
            const d = new Date(dateVal);
            const name = dayNamesMap[d.getDay()];
            if (activityMap[name]) {
                if (pVal !== undefined) activityMap[name].points += (typeof pVal === 'function' ? pVal(doc) : (doc[pVal] || 0));
                if (cVal !== undefined) activityMap[name].coins += (typeof cVal === 'function' ? cVal(doc) : (doc[cVal] || 0));
            }
        };

        weeklyProgressDocs.forEach(doc => processWeeklyDoc(doc, (d) => 100));
        weeklyTypingHistoryDocs.forEach(doc => processWeeklyDoc(doc, 'pointsAwarded'));
        weeklyTypingProgressDocs.forEach(doc => processWeeklyDoc(doc, 'pointsAwarded'));
        weeklyAttendanceDocs.forEach(doc => processWeeklyDoc(doc, (d) => 50, (d) => 10));
        weeklyMockDocs.forEach(doc => processWeeklyDoc(doc, 
            (d) => (d.pointsAwarded || d.pointsEarned || 0) + (d.bonusPoints || 0) + (d.firstInterviewBonus || 0),
            (d) => (d.coinsEarned || 0) + (d.bonusCoins || 0) + (d.firstInterviewCoinsBonus || 0)
        ));

        const weeklyActivity = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(name => ({
            name,
            points: activityMap[name].points,
            coins: activityMap[name].coins
        }));

        // ─── 8. Daily Points (Topics + Typing + Attendance) ──────────────────────
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [topicsToday, typingHistoryToday, typingProgressToday, attendanceToday, mockToday] = await Promise.all([
            Progress.countDocuments({
                studentId,
                completed: true,
                updatedAt: { $gte: startOfToday }
            }),
            TypingHistory.find({
                studentId,
                createdAt: { $gte: startOfToday }
            }),
            TypingProgress.find({
                studentId,
                createdAt: { $gte: startOfToday }
            }),
            Attendance.countDocuments({
                studentId,
                method: 'qr',
                status: 'present',
                date: { $gte: startOfToday }
            }),
            MockInterviewFeedback.find({
                studentId,
                isSubmitted: true,
                $or: [
                    { interviewDate: { $gte: startOfToday } },
                    { createdAt: { $gte: startOfToday } }
                ]
            })
        ]);

        const typingPointsToday = [...typingHistoryToday, ...typingProgressToday].reduce((acc, h) => acc + (h.pointsAwarded || 0), 0);
        const mockPointsToday = mockToday.reduce((acc, m) => acc + (m.pointsAwarded || m.pointsEarned || 0) + (m.bonusPoints || 0) + (m.firstInterviewBonus || 0), 0);
        const dailyPoints = (topicsToday * 100) + typingPointsToday + (attendanceToday * 50) + mockPointsToday;

        res.json({
            success: true,
            stats: {
                enrolledCourses: enrolledCoursesCount,
                hoursLearned,
                attendance: attendanceCount,
                batchProgress,
                points: student.points || 0,
                dailyPoints: dailyPoints,
                dailyGoal: 100,
                certificates: 0,
                currentStreak: student.currentStreak || 0,
                highestStreak: student.highestStreak || 0
            },
            recentActivity,
            weeklyActivity
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Student Leaderboard (Top 10 of the week by unified points)
// @route   GET /api/students/leaderboard?studentId=...&period=daily|weekly
// @access  Public
exports.getLeaderboard = async (req, res) => {
    try {
        const { studentId, period = 'weekly' } = req.query;
        let studentIdsInBatch = null;

        // 1. Determine Cohort (Batch)
        if (studentId) {
            const myBatchEntry = await BatchStudent.findOne({ studentId });
            if (myBatchEntry) {
                const batchSiblings = await BatchStudent.find({ batchId: myBatchEntry.batchId }).select('studentId');
                studentIdsInBatch = batchSiblings.map(s => s.studentId);
            }
        }

        // 2. Determine Timeframe
        if (period === 'all_time') {
            const filter = { 
                'preferences.showOnLeaderboard': { $ne: false }, 
                ...(studentIdsInBatch ? { _id: { $in: studentIdsInBatch } } : {})
            };
            
            const leaderboard = await Student.find(filter)
                .sort({ points: -1 })
                .limit(100)
                .select('name email profilePicture points')
                .lean();

            const formattedLeaderboard = leaderboard.map((entry, index) => ({
                rank: index + 1,
                id: entry._id,
                name: entry.name,
                email: entry.email,
                profilePicture: entry.profilePicture,
                points: entry.points || 0
            }));
            
            return res.json({ success: true, period, leaderboard: formattedLeaderboard });
        }

        const now = new Date();
        const startOfPeriod = new Date(now);
        if (period === 'daily') {
            startOfPeriod.setHours(0, 0, 0, 0);
        } else {
            // Weekly: Start from Sunday
            const day = now.getDay();
            const diff = now.getDate() - day;
            startOfPeriod.setDate(diff);
            startOfPeriod.setHours(0, 0, 0, 0);
        }

        // 3. Unified Points Calculation (Topics + Typing + Attendance)
        // We iterate through students in the batch (or all students if no batch)
        // EXCLUDE students who have opted out of the leaderboard
        const filter = { 
            'preferences.showOnLeaderboard': { $ne: false }, 
            ...(studentIdsInBatch ? { _id: { $in: studentIdsInBatch } } : {})
        };
        
        const leaderboard = await Student.aggregate([
            { $match: filter },
            {
                $facet: {
                    // Points from Course Topics (100 pts each)
                    "topicPoints": [
                        { $lookup: {
                            from: 'progresses',
                            localField: '_id',
                            foreignField: 'studentId',
                            as: 'p'
                        }},
                        { $unwind: "$p" },
                        { $match: { "p.completed": true, "p.updatedAt": { $gte: startOfPeriod } } },
                        { $group: { _id: "$_id", count: { $sum: 100 } } }
                    ],
                    // Points from Typing Practice (100 pts each 35+ WPM)
                    "typingPoints": [
                        { $lookup: {
                            from: 'typinghistories',
                            localField: '_id',
                            foreignField: 'studentId',
                            as: 't1'
                        }},
                        { $lookup: {
                            from: 'typingprogresses',
                            let: { sid: { $toString: "$_id" } },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$studentId", "$$sid"] } } }
                            ],
                            as: 't2'
                        }},
                        { $project: {
                            allTyping: { $concatArrays: ["$t1", "$t2"] }
                        }},
                        { $unwind: "$allTyping" },
                        { $match: { 
                            "allTyping.createdAt": { $gte: startOfPeriod },
                            "allTyping.pointsAwarded": { $exists: true, $gt: 0 }
                        } },
                        { $group: { _id: "$_id", count: { $sum: "$allTyping.pointsAwarded" } } }
                    ],
                    // Points from Attendance (50 pts each QR mark)
                    "attendancePoints": [
                        { $lookup: {
                            from: 'attendances',
                            localField: '_id',
                            foreignField: 'studentId',
                            as: 'a'
                        }},
                        { $unwind: "$a" },
                        { $match: { "a.method": 'qr', "a.status": 'present', "a.date": { $gte: startOfPeriod } } },
                        { $group: { _id: "$_id", count: { $sum: 50 } } }
                    ],
                    // Points from Mock Interviews
                    "interviewPoints": [
                        { $lookup: {
                            from: 'mockinterviewfeedbacks',
                            localField: '_id',
                            foreignField: 'studentId',
                            as: 'mi'
                        }},
                        { $unwind: "$mi" },
                        { $match: { 
                            "mi.isSubmitted": true,
                            $or: [
                                { "mi.interviewDate": { $gte: startOfPeriod } },
                                { "mi.createdAt": { $gte: startOfPeriod } }
                            ]
                        } },
                        { $group: { 
                            _id: "$_id", 
                            count: { $sum: { $add: ["$mi.pointsEarned", "$mi.bonusPoints", "$mi.firstInterviewBonus"] } } 
                        } }
                    ]
                }
            },
            {
                $project: {
                    combined: { $concatArrays: ["$topicPoints", "$typingPoints", "$attendancePoints", "$interviewPoints"] }
                }
            },
            { $unwind: "$combined" },
            { $group: { _id: "$combined._id", totalPoints: { $sum: "$combined.count" } } },
            { $sort: { totalPoints: -1 } },
            { $limit: 100 }, // Get top 100 to be safe
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'info'
                }
            },
            { $unwind: "$info" },
            {
                $project: {
                    _id: 1,
                    name: "$info.name",
                    email: "$info.email",
                    profilePicture: "$info.profilePicture",
                    points: "$totalPoints"
                }
            }
        ]);

        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            id: entry._id,
            name: entry.name,
            email: entry.email,
            profilePicture: entry.profilePicture,
            points: entry.points || 0
        }));

        res.json({ success: true, period, leaderboard: formattedLeaderboard });

    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get time-range activity data for dashboard chart (Week / Month / Year)
// @route   GET /api/students/activity/:studentId?range=week|month|year
// @access  Student
exports.getStudentActivity = async (req, res) => {
    try {
        const { studentId } = req.params;
        const range = req.query.range || 'week'; // default: week

        const now = new Date();
        let startDate;
        let chartData = [];

        // ── Determine date range boundaries ──────────────────────────────────────
        if (range === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day;
            startDate = new Date(now);
            startDate.setDate(diff);
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        } else if (range === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        } else {
            return res.status(400).json({ message: 'Invalid range. Use week, month, or year.' });
        }

        // ── Fetch Activity Data ──────────────────────────────────────────────────
        const sId = new mongoose.Types.ObjectId(studentId);

        // ── Fetch Activity Data ──────────────────────────────────────────────────
        const [progressDocs, typingHistoryDocs, typingProgressDocs, attendanceDocs, mockDocs] = await Promise.all([
            Progress.find({
                studentId: sId,
                completed: true,
                updatedAt: { $gte: startDate }
            }).lean(),
            TypingHistory.find({
                studentId: sId,
                createdAt: { $gte: startDate }
            }).lean(),
            TypingProgress.find({
                studentId: sId,
                createdAt: { $gte: startDate }
            }).lean(),
            Attendance.find({
                studentId: sId,
                method: 'qr',
                status: 'present',
                date: { $gte: startDate }
            }).lean(),
            MockInterviewFeedback.find({
                studentId: sId,
                isSubmitted: true,
                $or: [
                    { interviewDate: { $gte: startDate } },
                    { createdAt: { $gte: startDate } }
                ]
            }).lean()
        ]);

        // ── Build chart buckets ───────────────────────────────────────────────────
        const createBucketMap = (keys) => {
            const map = {};
            keys.forEach(k => { map[k] = { points: 0, coins: 0 }; });
            return map;
        };

        let bucketKeys = [];
        let map = {};

        const processGenericDoc = (doc, currentMap, pVal, cVal) => {
            const dateVal = doc.interviewDate || doc.date || doc.createdAt || doc.updatedAt || doc.completedAt;
            if (!dateVal) return;
            const d = new Date(dateVal);
            
            let key;
            if (range === 'week') {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                key = dayNames[d.getDay()];
            } else if (range === 'month') {
                key = String(d.getDate());
            } else if (range === 'year') {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                key = monthNames[d.getMonth()];
            }

            if (currentMap[key]) {
                if (pVal !== undefined) currentMap[key].points += (typeof pVal === 'function' ? pVal(doc) : (doc[pVal] || 0));
                if (cVal !== undefined) currentMap[key].coins += (typeof cVal === 'function' ? cVal(doc) : (doc[cVal] || 0));
            }
        };

        if (range === 'week') {
            bucketKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        } else if (range === 'month') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            bucketKeys = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
        } else if (range === 'year') {
            bucketKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }
        
        map = createBucketMap(bucketKeys);

        progressDocs.forEach(doc => processGenericDoc(doc, map, (d) => 100));
        typingHistoryDocs.forEach(doc => processGenericDoc(doc, map, 'pointsAwarded'));
        typingProgressDocs.forEach(doc => processGenericDoc(doc, map, 'pointsAwarded'));
        attendanceDocs.forEach(doc => processGenericDoc(doc, map, (d) => 50, (d) => 10));
        mockDocs.forEach(doc => processGenericDoc(doc, map, 
            (d) => (d.pointsAwarded || d.pointsEarned || 0) + (d.bonusPoints || 0) + (d.firstInterviewBonus || 0),
            (d) => (d.coinsEarned || 0) + (d.bonusCoins || 0) + (d.firstInterviewCoinsBonus || 0)
        ));

        chartData = bucketKeys.map(name => ({ name, ...map[name] }));

        // ── Period summary stats ──────────────────────────────────────────────────
        const totalPoints = chartData.reduce((acc, d) => acc + d.points, 0);
        const totalCoins = chartData.reduce((acc, d) => acc + d.coins, 0);
        const topicCount = progressDocs.length;

        // Count unique active days
        const activeDaySet = new Set();
        [...progressDocs, ...typingHistoryDocs, ...typingProgressDocs, ...attendanceDocs, ...mockDocs].forEach(p => {
            const dateVal = p.interviewDate || p.date || p.createdAt || p.updatedAt || p.completedAt;
            if (dateVal) {
                const d = new Date(dateVal);
                activeDaySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
            }
        });
        const activeDays = activeDaySet.size;

        res.json({
            success: true,
            range,
            chartData,
            summary: {
                totalPoints,
                totalCoins,
                topicCount,
                activeDays
            }
        });
    } catch (err) {
        console.error('Error fetching student activity:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get Mock Interview Leaderboard (Batch-based)
// @route   GET /api/students/leaderboard/interviews?studentId=...
// @access  Student
exports.getInterviewLeaderboard = async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) return res.status(400).json({ message: 'studentId is required' });

        // 1. Get Student's Batch
        const myBatchEntry = await BatchStudent.findOne({ studentId });
        if (!myBatchEntry) {
            return res.json({ success: true, leaderboard: [], message: 'No batch found for this student' });
        }

        // 2. Get all students in the batch
        const batchSiblings = await BatchStudent.find({ batchId: myBatchEntry.batchId }).select('studentId');
        const studentIds = batchSiblings.map(s => s.studentId);

        // 3. Aggregate Latest Interview Feedback for each student
        const leaderboard = await MockInterviewFeedback.aggregate([
            { $match: { studentId: { $in: studentIds }, isSubmitted: true } },
            // Sort by date to get the LATEST feedback per student
            { $sort: { interviewDate: -1, createdAt: -1 } },
            {
                $group: {
                    _id: "$studentId",
                    latestScore: { $first: "$overallScore" },
                    status: { $first: "$status" },
                    feedbackId: { $first: "$_id" },
                    date: { $first: "$interviewDate" }
                }
            },
            // Join with Student info
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: "$studentInfo" },
            // Filter out students who requested to be hidden
            { $match: { "studentInfo.preferences.showOnLeaderboard": { $ne: false } } },
            // Sort by score desc, then date
            { $sort: { latestScore: -1, date: -1 } },
            {
                $project: {
                    id: "$_id",
                    name: "$studentInfo.name",
                    profilePicture: "$studentInfo.profilePicture",
                    points: "$latestScore", // Using points key for frontend compatibility
                    status: 1,
                    isMock: { $literal: true }
                }
            }
        ]);

        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        res.json({ success: true, leaderboard: formattedLeaderboard });

    } catch (err) {
        console.error('Error fetching interview leaderboard:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
