const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const TopicContent = require('../models/TopicContent');
const StudentTaskSubmission = require('../models/StudentTaskSubmission');
const StudentAssignmentSubmission = require('../models/StudentAssignmentSubmission');
const StudentMCQAttempt = require('../models/StudentMCQAttempt');
const HiringTest = require('../models/HiringTest');

// Configure Multer
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

const uploadToCloudinary = async (filePath, folder) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true
        });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return result;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
    }
};

// ─────────────────────────────────────────────────────────
// ADMIN ROUTES – Topic Content Management
// ─────────────────────────────────────────────────────────

// @route   GET /api/topic-content/:topicId
// @desc    Get all content for a topic (MCQs, tasks, assignments)
// @access  Admin / Student
router.get('/:topicId', async (req, res) => {
    try {
        let content = await TopicContent.findOne({ topicId: req.params.topicId });

        if (!content) {
            // Return empty shell
            return res.json({ success: true, content: null });
        }

        // Populate MCQ test if linked
        if (content.mcqTest?.testId) {
            await content.populate('mcqTest.testId');
        }

        // Populate multiple MCQ tests if present
        if (content.mcqTests && content.mcqTests.length > 0) {
            await content.populate('mcqTests.testId');
        }

        res.json({ success: true, content });
    } catch (err) {
        console.error('Get Topic Content Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/mcqs
// @desc    Map/update MCQ test for a topic
// @access  Admin
router.post('/:topicId/mcqs', async (req, res) => {
    try {
        const { testId } = req.body;
        const { topicId } = req.params;

        const test = await HiringTest.findById(testId);
        if (!test || test.type !== 'mcq') {
            return res.status(400).json({ message: 'Invalid MCQ test' });
        }

        const content = await TopicContent.findOneAndUpdate(
            { topicId },
            { $set: { 'mcqTest.testId': testId, 'mcqTest.enabled': true } },
            { upsert: true, new: true }
        ).populate('mcqTest.testId');

        res.json({ success: true, content });
    } catch (err) {
        console.error('Map MCQ Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/topic-content/:topicId/mcqs
// @desc    Remove MCQ mapping from a topic
// @access  Admin
router.delete('/:topicId/mcqs', async (req, res) => {
    try {
        await TopicContent.findOneAndUpdate(
            { topicId: req.params.topicId },
            { $set: { 'mcqTest.testId': null, 'mcqTest.enabled': false } }
        );
        res.json({ success: true, message: 'MCQ mapping removed' });
    } catch (err) {
        console.error('Remove MCQ Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/mcq-tests
// @desc    Add an MCQ test to the list of tests
// @access  Admin
router.post('/:topicId/mcq-tests', async (req, res) => {
    try {
        const { testId, requiredTier } = req.body;
        const { topicId } = req.params;

        const test = await HiringTest.findById(testId);
        if (!test || test.type !== 'mcq') {
            return res.status(400).json({ message: 'Invalid MCQ test' });
        }

        const content = await TopicContent.findOneAndUpdate(
            { topicId },
            { $push: { mcqTests: { testId, enabled: true, requiredTier: requiredTier || 'Basic' } } },
            { upsert: true, new: true }
        ).populate('mcqTests.testId');

        if (content.mcqTest?.testId) {
            await content.populate('mcqTest.testId');
        }

        res.json({ success: true, content });
    } catch (err) {
        console.error('Add MCQ Test Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/topic-content/:topicId/mcq-tests/:testIndex
// @desc    Remove an MCQ test by index
// @access  Admin
router.delete('/:topicId/mcq-tests/:testIndex', async (req, res) => {
    try {
        const content = await TopicContent.findOne({ topicId: req.params.topicId });
        if (!content) return res.status(404).json({ message: 'Content not found' });

        const idx = parseInt(req.params.testIndex);
        content.mcqTests.splice(idx, 1);
        await content.save();

        await content.populate('mcqTests.testId');
        if (content.mcqTest?.testId) {
            await content.populate('mcqTest.testId');
        }

        res.json({ success: true, content });
    } catch (err) {
        console.error('Delete MCQ Test Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/task
// @desc    Add a task to a topic
// @access  Admin
router.post('/:topicId/task', upload.single('file'), async (req, res) => {
    try {
        const { title, description, requiredTier } = req.body;
        const { topicId } = req.params;

        if (!title) return res.status(400).json({ message: 'Task title is required' });

        let fileUrl = req.body.fileUrl || '';
        let filePublicId = '';

        if (req.file) {
            const result = await uploadToCloudinary(req.file.path, 'topic_tasks');
            fileUrl = result.secure_url;
            filePublicId = result.public_id;
        }

        const content = await TopicContent.findOneAndUpdate(
            { topicId },
            { $push: { tasks: { title, description: description || '', fileUrl, filePublicId, requiredTier: requiredTier || 'Basic' } } },
            { upsert: true, new: true }
        );

        res.json({ success: true, content });
    } catch (err) {
        console.error('Add Task Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/topic-content/:topicId/task/:taskIndex
// @desc    Remove a task from a topic
// @access  Admin
router.delete('/:topicId/task/:taskIndex', async (req, res) => {
    try {
        const content = await TopicContent.findOne({ topicId: req.params.topicId });
        if (!content) return res.status(404).json({ message: 'Content not found' });

        const idx = parseInt(req.params.taskIndex);
        content.tasks.splice(idx, 1);
        await content.save();

        res.json({ success: true, content });
    } catch (err) {
        console.error('Delete Task Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/assignment
// @desc    Add an assignment (with optional PDF question upload)
// @access  Admin
router.post('/:topicId/assignment', upload.single('questionFile'), async (req, res) => {
    try {
        const { title, requiredTier } = req.body;
        const { topicId } = req.params;

        if (!title) return res.status(400).json({ message: 'Assignment title is required' });

        let questionUrl = req.body.questionUrl || '';
        let questionPublicId = '';

        if (req.file) {
            const result = await uploadToCloudinary(req.file.path, 'topic_assignments');
            questionUrl = result.secure_url;
            questionPublicId = result.public_id;
        }

        const content = await TopicContent.findOneAndUpdate(
            { topicId },
            { $push: { assignments: { title, questionUrl, questionPublicId, requiredTier: requiredTier || 'Basic' } } },
            { upsert: true, new: true }
        );

        res.json({ success: true, content });
    } catch (err) {
        console.error('Add Assignment Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/topic-content/:topicId/assignment/:assignmentIndex
// @desc    Remove an assignment from a topic
// @access  Admin
router.delete('/:topicId/assignment/:assignmentIndex', async (req, res) => {
    try {
        const content = await TopicContent.findOne({ topicId: req.params.topicId });
        if (!content) return res.status(404).json({ message: 'Content not found' });

        const idx = parseInt(req.params.assignmentIndex);
        content.assignments.splice(idx, 1);
        await content.save();

        res.json({ success: true, content });
    } catch (err) {
        console.error('Delete Assignment Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// STUDENT ROUTES – Submissions & MCQ Attempts
// ─────────────────────────────────────────────────────────

// @route   POST /api/topic-content/:topicId/submit/task
// @desc    Student submits a task answer (text + optional file)
// @access  Student
router.post('/:topicId/submit/task', upload.single('file'), async (req, res) => {
    try {
        const { studentId, taskIndex, answerText } = req.body;
        const { topicId } = req.params;

        if (!studentId) return res.status(400).json({ message: 'studentId is required' });

        let fileUrl = '';
        let filePublicId = '';

        if (req.file) {
            const result = await uploadToCloudinary(req.file.path, 'student_task_submissions');
            fileUrl = result.secure_url;
            filePublicId = result.public_id;
        }

        // Upsert submission (overwrites if already submitted)
        const submission = await StudentTaskSubmission.findOneAndUpdate(
            { studentId, topicId, taskIndex: parseInt(taskIndex) || 0 },
            { answerText: answerText || '', fileUrl, filePublicId, submittedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ success: true, submission });
    } catch (err) {
        console.error('Submit Task Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/submit/assignment
// @desc    Student uploads assignment answer file
// @access  Student
router.post('/:topicId/submit/assignment', upload.single('file'), async (req, res) => {
    try {
        const { studentId, assignmentIndex } = req.body;
        const { topicId } = req.params;

        if (!studentId) return res.status(400).json({ message: 'studentId is required' });
        if (!req.file) return res.status(400).json({ message: 'Answer file is required' });

        const result = await uploadToCloudinary(req.file.path, 'student_assignment_submissions');

        const submission = await StudentAssignmentSubmission.findOneAndUpdate(
            { studentId, topicId, assignmentIndex: parseInt(assignmentIndex) || 0 },
            { fileUrl: result.secure_url, filePublicId: result.public_id, submittedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ success: true, submission });
    } catch (err) {
        console.error('Submit Assignment Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/topic-content/:topicId/attempt-mcq
// @desc    Student attempts MCQ quiz for a topic (retake allowed if score < 75%)
// @access  Student
router.post('/:topicId/attempt-mcq', async (req, res) => {
    try {
        const { studentId, testId, answers } = req.body;
        const { topicId } = req.params;

        if (!studentId || !testId || !answers) {
            return res.status(400).json({ message: 'studentId, testId, and answers are required' });
        }

        // Check if already attempted
        const existing = await StudentMCQAttempt.findOne({ studentId, topicId, testId });
        if (existing) {
            const existingPct = existing.total > 0 ? (existing.score / existing.total) * 100 : 0;
            if (existingPct >= 75) {
                // Already passed — no retake needed
                return res.status(400).json({ message: 'You have already passed this quiz', attempt: existing });
            }
            // Score < 75% — delete old attempt to allow retake
            await StudentMCQAttempt.deleteOne({ _id: existing._id });
        }

        // Fetch the test to grade
        const test = await HiringTest.findById(testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        // Grading — answers use original question index as questionId
        let score = 0;
        const total = test.questions.length;

        test.questions.forEach((q, idx) => {
            const studentAnswer = answers.find(a => a.questionId === String(idx));
            if (!studentAnswer) return;

            const correctSet = new Set(q.correctAnswers);
            const selectedSet = new Set(studentAnswer.selected);

            // Correct if selected set exactly matches correct answers
            if (
                correctSet.size === selectedSet.size &&
                [...correctSet].every(c => selectedSet.has(c))
            ) {
                score++;
            }
        });

        const attempt = await StudentMCQAttempt.create({
            studentId,
            topicId,
            testId,
            answers,
            score,
            total
        });

        res.json({ success: true, attempt });
    } catch (err) {
        console.error('Attempt MCQ Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});



// @route   GET /api/topic-content/:topicId/all-submissions
// @desc    Get ALL student submissions for a topic (admin / trainer)
// @access  Admin / Trainer
router.get('/:topicId/all-submissions', async (req, res) => {
    try {
        const { topicId } = req.params;

        const [taskSubs, assignmentSubs, mcqAttempts] = await Promise.all([
            StudentTaskSubmission.find({ topicId })
                .populate('studentId', 'name email')
                .sort({ submittedAt: -1 }),
            StudentAssignmentSubmission.find({ topicId })
                .populate('studentId', 'name email')
                .sort({ submittedAt: -1 }),
            StudentMCQAttempt.find({ topicId })
                .populate('studentId', 'name email')
                .sort({ attemptedAt: -1 })
        ]);

        res.json({
            success: true,
            submissions: {
                tasks: taskSubs,
                assignments: assignmentSubs,
                mcq: mcqAttempts
            }
        });
    } catch (err) {
        console.error('Get All Submissions Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/topic-content/:topicId/my-submissions/:studentId
// @desc    Get student's submissions and attempt for a topic
// @access  Student
router.get('/:topicId/my-submissions/:studentId', async (req, res) => {
    try {
        const { topicId, studentId } = req.params;

        const [taskSubmissions, assignmentSubmissions, mcqAttempts] = await Promise.all([
            StudentTaskSubmission.find({ studentId, topicId }),
            StudentAssignmentSubmission.find({ studentId, topicId }),
            StudentMCQAttempt.find({ studentId, topicId })
        ]);

        res.json({
            success: true,
            submissions: {
                tasks: taskSubmissions,
                assignments: assignmentSubmissions,
                mcq: mcqAttempts[0] || null, // legacy single compat
                mcqs: mcqAttempts
            }
        });
    } catch (err) {
        console.error('Get Submissions Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
