const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const BatchStudent = require('../models/BatchStudent');
const Student = require('../models/Student');
const Course = require('../models/Course');
const FeeStructure = require('../models/FeeStructure');
const Installment = require('../models/Installment');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');

// @route   POST /api/batches
// @desc    Create a new batch
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const { name, courses, startDate, endDate, maxStudents, description, status } = req.body;

        if (!name || !courses || !startDate || !endDate) {
            return res.status(400).json({ message: 'Name, courses, startDate, and endDate are required' });
        }

        // Verify the courses exist
        const courseList = await Course.find({ _id: { $in: courses } });
        if (courseList.length !== courses.length) return res.status(404).json({ message: 'One or more courses not found' });

        const batch = new Batch({ name, courses, startDate, endDate, maxStudents, description, status });
        await batch.save();

        res.status(201).json({ success: true, batch });
    } catch (err) {
        console.error('Create Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/batches
// @desc    List all batches with course info
// @access  Admin
router.get('/', async (req, res) => {
    try {
        const { courseId } = req.query;
        let filter = {};
        
        // Prevent CastError if courseId is string "undefined" or null
        if (courseId && courseId !== 'undefined' && courseId !== 'null') {
            filter.courses = courseId;
        }

        const batches = await Batch.find(filter)
            .populate('courses', 'title classLevel')
            .sort({ createdAt: -1 });

        // Attach student count to each batch
        const batchesWithCount = await Promise.all(
            batches.map(async (batch) => {
                const count = await BatchStudent.countDocuments({ batchId: batch._id });
                return { ...batch.toObject(), studentCount: count };
            })
        );

        res.json({ success: true, batches: batchesWithCount });
    } catch (err) {
        console.error('List Batches Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/batches/:id
// @desc    Get batch details
// @access  Admin
router.get('/:id', async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id).populate('courses', 'title duration classLevel');
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        const studentCount = await BatchStudent.countDocuments({ batchId: batch._id });
        res.json({ success: true, batch: { ...batch.toObject(), studentCount } });
    } catch (err) {
        console.error('Get Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/batches/:id
// @desc    Update a batch
// @access  Admin
router.put('/:id', async (req, res) => {
    try {
        const { name, courses, startDate, endDate, maxStudents, description, status } = req.body;

        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            { name, courses, startDate, endDate, maxStudents, description, status },
            { new: true, runValidators: true }
        ).populate('courses', 'title classLevel');

        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        res.json({ success: true, batch });
    } catch (err) {
        console.error('Update Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/batches/:id
// @desc    Delete a batch
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        // Remove all student enrollments for this batch
        await BatchStudent.deleteMany({ batchId: batch._id });
        await batch.deleteOne();

        res.json({ success: true, message: 'Batch deleted' });
    } catch (err) {
        console.error('Delete Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/batches/:id/assign
// @desc    Assign students to a batch
// @access  Admin
router.post('/:id/assign', async (req, res) => {
    try {
        // Support both studentId (for backwards compatibility) and studentIds array
        const { studentId, studentIds, enrollmentDate } = req.body;
        const batchId = req.params.id;

        let idsToAssign = [];
        if (studentIds && Array.isArray(studentIds)) {
            idsToAssign = studentIds;
        } else if (studentId) {
            idsToAssign = [studentId];
        }

        if (idsToAssign.length === 0) {
            return res.status(400).json({ message: 'No students selected' });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        // Check capacity
        const currentCount = await BatchStudent.countDocuments({ batchId });
        if (currentCount + idsToAssign.length > batch.maxStudents) {
            return res.status(400).json({ 
                message: `Batch capacity exceeded. Can only add ${batch.maxStudents - currentCount} more students.` 
            });
        }

        const enrollments = [];
        for (const sId of idsToAssign) {
            const student = await Student.findById(sId);
            if (!student) continue;

            // Upsert: if student is already in this batch, update it
            const enrollment = await BatchStudent.findOneAndUpdate(
                { studentId: sId, batchId },
                {
                    batchId,
                    enrollmentDate: enrollmentDate || new Date(),
                    status: 'active'
                },
                { upsert: true, new: true }
            );
            enrollments.push(enrollment);
        }

        res.json({ success: true, enrollments, message: `Successfully assigned ${enrollments.length} student(s)` });
    } catch (err) {
        console.error('Assign Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/batches/assign-bonus
// @desc    Bulk assign a bonus course to students
// @access  Admin
router.post('/assign-bonus', async (req, res) => {
    try {
        let { courseId, targetBatchId, studentIds } = req.body;

        if (!courseId || !studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'courseId and studentIds array are required' });
        }

        // Auto-create/Find a general Bonus Batch if none is provided
        if (!targetBatchId) {
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ message: 'Course not found' });
            
            let genericBatch = await Batch.findOne({ courses: course._id, name: /Bonus/i });
            if (!genericBatch) {
                genericBatch = new Batch({
                    name: `Auto Bonus Batch - ${course.title.substring(0, 15)}`,
                    courses: [course._id],
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
                    maxStudents: 5000,
                    description: 'Auto-generated batch for bonus course access',
                    status: 'active'
                });
                await genericBatch.save();
            }
            targetBatchId = genericBatch._id;
        }

        const results = await Promise.all(studentIds.map(async (studentId) => {
            return await BatchStudent.findOneAndUpdate(
                { studentId, courseId },
                { 
                    batchId: targetBatchId, 
                    isBonus: true,
                    enrollmentDate: new Date(),
                    status: 'active'
                },
                { upsert: true, new: true }
            );
        }));

        res.json({ success: true, message: `Successfully assigned bonus course to ${results.length} students`, results });
    } catch (err) {
        console.error('Assign Bonus Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/batches/student/change-batch
// @desc    Move a student to a different batch
// @access  Admin
router.put('/student/change-batch', async (req, res) => {
    try {
        const { studentId, studentIds, newBatchId, oldBatchId } = req.body;

        const newBatch = await Batch.findById(newBatchId);
        if (!newBatch) return res.status(404).json({ message: 'Target batch not found' });

        const idsToMove = studentIds || (studentId ? [studentId] : []);
        if (idsToMove.length === 0) return res.status(400).json({ message: 'No students selected' });

        const results = await Promise.all(idsToMove.map(async (sId) => {
            // Check if student is already in the new batch
            const existingInNewBatch = await BatchStudent.findOne({ studentId: sId, batchId: newBatchId });

            if (existingInNewBatch) {
                // If already in new batch, just delete the old batch enrollment
                if (oldBatchId && oldBatchId !== newBatchId) {
                    await BatchStudent.findOneAndDelete({ studentId: sId, batchId: oldBatchId });
                }
                return existingInNewBatch;
            } else {
                // Not in new batch yet. 
                if (oldBatchId) {
                    const updated = await BatchStudent.findOneAndUpdate(
                        { studentId: sId, batchId: oldBatchId },
                        { batchId: newBatchId, enrollmentDate: new Date() },
                        { new: true }
                    );
                    if (updated) return updated;
                }
                
                // Fallback creation
                return await BatchStudent.findOneAndUpdate(
                    { studentId: sId, batchId: newBatchId },
                    { batchId: newBatchId, enrollmentDate: new Date() },
                    { new: true, upsert: true }
                );
            }
        }));

        res.json({ success: true, message: `Successfully moved ${results.length} students` });
    } catch (err) {
        console.error('Change Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/batches/:id/students
// @desc    List all students in a batch (with fee summary)
// @access  Admin
router.get('/:id/students', async (req, res) => {
    try {
        const enrollments = await BatchStudent.find({ batchId: req.params.id })
            .populate('studentId', 'name email phone status courseName profilePicture')
            .sort({ enrollmentDate: -1 });

        // Attach fee summary for each student
        const enriched = await Promise.all(
            enrollments.map(async (enrollment) => {
                const studentId = enrollment.studentId?._id;
                if (!studentId) return enrollment.toObject();

                const feeStructure = await FeeStructure.findOne({ student_id: studentId });
                if (!feeStructure) {
                    return { ...enrollment.toObject(), feeSummary: null };
                }

                // Aggressive fix: Fetch ALL installments for this student regardless of which fee structure record they belong to.
                // This fixes the "0 Rupee Paid" issue when duplicate fee structures exist.
                const installments = await Installment.find({ student_id: studentId });
                const paidInstallments = installments.filter(i => i.status === 'Paid');
                const overdueInstallments = installments.filter(i => i.status === 'Overdue');
                const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
                const pendingAmount = feeStructure.total_fee - paidAmount;

                return {
                    ...enrollment.toObject(),
                    feeSummary: {
                        totalFee: feeStructure.total_fee,
                        totalInstallments: feeStructure.total_installments,
                        paidInstallments: paidInstallments.length,
                        overdueInstallments: overdueInstallments.length,
                        paidAmount,
                        pendingAmount
                    }
                };
            })
        );

        res.json({ success: true, students: enriched });
    } catch (err) {
        console.error('Batch Students Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/batches/student/:studentId/enrollment
// @desc    Get a student's current batch enrollment(s)
// @access  Admin/Student
router.get('/student/:studentId/enrollment', async (req, res) => {
    try {
        const enrollments = await BatchStudent.find({ studentId: req.params.studentId })
            .populate({
                path: 'batchId',
                select: 'name startDate endDate status courses',
                populate: {
                    path: 'courses'
                }
            });

        // Fetch direct purchase/unlock records
        const StudentCourse = require('../models/StudentCourse');
        const unlockedCourses = await StudentCourse.find({ studentId: req.params.studentId }).populate('courseId');

        // Get IDs of courses that are currently in a batch enrollment for this student
        const batchCourseIds = new Set();
        enrollments.forEach(e => {
            if (e.batchId && e.batchId.courses) {
                e.batchId.courses.forEach(c => {
                    batchCourseIds.add(c._id ? c._id.toString() : c.toString());
                });
            }
        });

        // Create a normalized list from batch enrollments
        const filteredBatchEnrollments = enrollments.filter(e => {
            // Only hide bonus courses from batch list if they are locked 
            // Since they are in BatchStudent, they are technically "assigned", but we want to honor the paywall.
            // If the admin assigned it via batch, we consider it "unlocked via batch" UNLESS 
            // we want to strictly force store unlock. For now, if it's in BatchStudent, it's visible.
            return true; 
        });

        // Convert StudentCourse records (direct unlocks) into an enrollment-like structure
        const directEnrollments = unlockedCourses
            .filter(u => u.courseId && !batchCourseIds.has(u.courseId._id.toString()))
            .map(u => ({
                _id: u._id,
                studentId: u.studentId,
                courseId: u.courseId,
                batchId: null,
                isBonus: true,
                status: 'active',
                enrollmentDate: u.unlockedAt
            }));

        // Fetch student to check for legacy courseName
        let legacyEnrollments = [];
        const student = await Student.findById(req.params.studentId);
        if (student && student.courseName) {
            const course = await Course.findOne({
                title: { $regex: new RegExp(`^${student.courseName.trim()}$`, 'i') }
            });
            if (course) {
                const courseIdStr = course._id.toString();
                // Check if this course is already covered by batchCourseIds or direct enrollments
                const isAlreadyBatch = batchCourseIds.has(courseIdStr);
                const isAlreadyDirect = directEnrollments.some(d => d.courseId && (d.courseId._id || d.courseId).toString() === courseIdStr);
                
                if (!isAlreadyBatch && !isAlreadyDirect) {
                    const mongoose = require('mongoose');
                    legacyEnrollments.push({
                        _id: new mongoose.Types.ObjectId(),
                        studentId: student._id,
                        courseId: course,
                        batchId: null,
                        isBonus: false,
                        status: 'active',
                        enrollmentDate: student.createdAt,
                        isLegacy: true
                    });
                }
            }
        }

        // Merge all lists
        const allEnrollments = [...filteredBatchEnrollments, ...directEnrollments, ...legacyEnrollments];

        const enrollmentsWithProgress = await Promise.all(allEnrollments.map(async (enrollment) => {
            const enrollmentObj = enrollment.toObject ? enrollment.toObject() : enrollment;
            let progress = 0;
            
            if (enrollmentObj.batchId && enrollmentObj.batchId.courses) {
                const coursesWithProgress = await Promise.all(enrollmentObj.batchId.courses.map(async (course) => {
                    const courseId = course._id || course;
                    let courseProgress = 0;
                    try {
                        const modules = await Module.find({ courseId }).select('_id');
                        const moduleIds = modules.map(m => m._id);
                        const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });
                        const completedTopics = await Progress.countDocuments({
                            studentId: req.params.studentId,
                            courseId,
                            completed: true
                        });
                        if (totalTopics > 0) {
                            courseProgress = Math.min(100, Math.round((completedTopics / totalTopics) * 100));
                        }
                    } catch (err) {
                        console.error('Error calculating enrollment progress for course:', err);
                    }
                    return {
                        ...(course.toObject ? course.toObject() : course),
                        progress: courseProgress
                    };
                }));
                enrollmentObj.batchId.courses = coursesWithProgress;
            } else {
                const courseId = enrollmentObj.courseId?._id || enrollmentObj.courseId;
                if (courseId) {
                    try {
                        const modules = await Module.find({ courseId }).select('_id');
                        const moduleIds = modules.map(m => m._id);
                        const totalTopics = await Topic.countDocuments({ moduleId: { $in: moduleIds } });
                        const completedTopics = await Progress.countDocuments({
                            studentId: req.params.studentId,
                            courseId,
                            completed: true
                        });
                        if (totalTopics > 0) {
                            progress = Math.min(100, Math.round((completedTopics / totalTopics) * 100));
                        }
                    } catch (err) {
                        console.error('Error calculating enrollment progress:', err);
                    }
                }
            }
            
            return {
                ...enrollmentObj,
                progress
            };
        }));

        res.json({ success: true, enrollments: enrollmentsWithProgress });
    } catch (err) {
        console.error('Get Student Enrollment Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/batches/:id/students/:studentId
// @desc    Remove a student from a batch
// @access  Admin
router.delete('/:id/students/:studentId', async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: 'Batch not found' });

        await BatchStudent.findOneAndDelete({ batchId: req.params.id, studentId: req.params.studentId });
        res.json({ success: true, message: 'Student removed from batch' });
    } catch (err) {
        console.error('Remove Student from Batch Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/batches/enrollments/all
// @desc    Get all batch-student assignments
// @access  Admin
router.get('/enrollments/all', async (req, res) => {
    try {
        const enrollments = await BatchStudent.find({})
            .populate('batchId', 'name')
            .select('studentId batchId');
        res.json({ success: true, count: enrollments.length, data: enrollments });
    } catch (err) {
        console.error('List All Enrollments Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
