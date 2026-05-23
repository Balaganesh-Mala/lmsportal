const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const Student = require('../models/Student');
const TopicContent = require('../models/TopicContent');

// @desc    Update progress for a topic
// @route   POST /api/student/progress/update
// @access  Student
exports.updateProgress = async (req, res) => {
    try {
        const { studentId, courseId, topicId, completed, watchedDuration, videoCompleted, quizCompleted, assignmentCompleted, assignmentId } = req.body;

        if (!studentId || !topicId || !courseId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let shouldAwardPoints = false;
        // Upsert progress
        let progress = await Progress.findOne({ studentId, topicId });

        if (progress) {
            if (completed && (!progress.completedAt || !progress.pointsAwarded)) {
                shouldAwardPoints = true;
            }
            if (courseId) progress.courseId = courseId;
            if (completed !== undefined) progress.completed = completed;
            if (videoCompleted !== undefined) progress.videoCompleted = videoCompleted;
            if (quizCompleted !== undefined) progress.quizCompleted = quizCompleted;
            if (assignmentCompleted !== undefined) progress.assignmentCompleted = assignmentCompleted;
            
            if (assignmentId) {
                if (!progress.completedAssignments) progress.completedAssignments = [];
                if (!progress.completedAssignments.includes(assignmentId)) {
                    progress.completedAssignments.push(assignmentId);
                }
                progress.assignmentCompleted = true; // Auto-mark overall assignment completed to support progress stats
            }
            
            if (watchedDuration !== undefined) progress.watchedDuration = watchedDuration;
            if (completed && !progress.completedAt) progress.completedAt = Date.now();
        } else {
            if (completed) {
                shouldAwardPoints = true;
            }
            
            const completedAssignments = assignmentId ? [assignmentId] : [];
            
            progress = new Progress({
                studentId,
                courseId,
                topicId,
                completed: completed || false,
                videoCompleted: videoCompleted || false,
                quizCompleted: quizCompleted || false,
                assignmentCompleted: assignmentCompleted || (assignmentId ? true : false),
                completedAssignments,
                watchedDuration: watchedDuration || 0,
                completedAt: completed ? Date.now() : undefined
            });
        }

        if (shouldAwardPoints) {
            try {
                await Student.findByIdAndUpdate(studentId, { $inc: { points: 100 } });
                if (progress) {
                    progress.pointsAwarded = true; 
                }
            } catch (pointErr) {
                console.error("Error awarding points to student:", pointErr);
            }
        }

        await progress.save();

        // --- Calculate & Update Overall Course Progress Percentage for Student ---
        try {
            // 1. Get all modules and topics for the course
            const modules = await Module.find({ courseId });
            const moduleIds = modules.map(m => m._id);
            const allTopics = await Topic.find({ moduleId: { $in: moduleIds } });
            const allTopicIds = allTopics.map(t => t._id);

            // 2. Determine total activities (Video + Quiz + Assignment)
            // Each topic has a video tab. Some have quizzes and assignments.
            let totalActivities = allTopicIds.length; // Total Video Tabs
            
            const contents = await TopicContent.find({ topicId: { $in: allTopicIds } });
            contents.forEach(c => {
                if (c.mcqTest?.enabled) totalActivities++;
                if (c.assignments?.length > 0) totalActivities++;
            });

            // 3. Get completed activities for this student
            const studentProgress = await Progress.find({ studentId, courseId });
            let completedActivities = 0;
            studentProgress.forEach(p => {
                if (p.videoCompleted || p.completed) completedActivities++; // Legacy 'completed' counts as video
                if (p.quizCompleted) completedActivities++;
                if (p.assignmentCompleted) completedActivities++;
            });

            // 4. Calculate Percentage
            let percentage = 0;
            if (totalActivities > 0) {
                percentage = Math.round((completedActivities / totalActivities) * 100);
            }
            percentage = Math.min(percentage, 100);

            // 5. Update Student Record
            await Student.findByIdAndUpdate(studentId, { progress: percentage });
            console.log(`Updated Student ${studentId} overall progress to ${percentage}% (${completedActivities}/${totalActivities})`);

        } catch (calcErr) {
            console.error("Error updating student overall progress:", calcErr);
        }
        // --------------------------------------------------------------------------

        res.json({ success: true, progress });

    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get progress for a course
// @route   GET /api/student/progress/:courseId/:studentId
// @access  Student
exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        const progress = await Progress.find({ courseId, studentId });
        res.json({ success: true, progress });
    } catch (err) {
        console.error('Error fetching progress:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get student completion stats (percentage)
// @route   GET /api/student/progress/stats/:studentId
// @access  Student
exports.getStudentCompletionStats = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Find the most recent courseId this student has progress records for
        //    (CoursePlayer always stores the real courseId ObjectId from the URL)
        const latestProgress = await Progress.findOne({ studentId, courseId: { $ne: null } })
            .sort({ updatedAt: -1 })
            .select('courseId');

        if (!latestProgress || !latestProgress.courseId) {
            return res.json({
                success: true,
                stats: {
                    completionPercentage: 0,
                    completedTopics: 0,
                    totalTopics: 0,
                    enrolled: false
                }
            });
        }

        const courseId = latestProgress.courseId;

        // 2. Count total topics in the course
        const modules = await Module.find({ courseId });
        const moduleIds = modules.map(m => m._id);
        const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });

        // 3. Count completed topics for this student in this course
        const completedTopics = await Progress.countDocuments({
            studentId,
            courseId,
            completed: true
        });

        // 4. Calculate percentage
        const percentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

        // 5. Get course name for display
        const course = await Course.findById(courseId).select('title');

        res.json({
            success: true,
            stats: {
                completionPercentage: percentage,
                completedTopics,
                totalTopics,
                enrolled: true,
                courseName: course?.title || ''
            }
        });

    } catch (err) {
        console.error('Error calculating completion stats:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Check if student is eligible to apply for jobs (>= 75% completion)
// @route   GET /api/students/:studentId/eligibility
// @access  Student
exports.getEligibility = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Derive courseId from the student's own Progress records
        const latestProgress = await Progress.findOne({ studentId, courseId: { $ne: null } })
            .sort({ updatedAt: -1 })
            .select('courseId');

        if (!latestProgress || !latestProgress.courseId) {
            return res.json({ eligible: false, completion: 0 });
        }

        const courseId = latestProgress.courseId;

        const modules = await Module.find({ courseId });
        const moduleIds = modules.map(m => m._id);
        const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });

        const completedTopics = await Progress.countDocuments({
            studentId,
            courseId,
            completed: true
        });

        const completion = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
        const eligible = completion >= 75;

        res.json({ eligible, completion });
    } catch (err) {
        console.error('Error checking eligibility:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
