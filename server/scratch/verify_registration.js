const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const BatchStudent = require('../models/BatchStudent');
require('dotenv').config({ path: '../.env' });

const run = async () => {
    let originalCourses = [];
    let testCourse = null;
    let batch = null;
    let student = null;
    let bsDoc = null;

    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // 1. Find a batch
        batch = await Batch.findOne({});
        if (!batch) {
            console.log('No batch found in DB. Please create a batch first.');
            return;
        }
        console.log(`Found batch: ${batch.name} (${batch._id})`);

        // Find or create a course to make sure the batch has at least one course
        testCourse = await Course.findOne({});
        if (!testCourse) {
            console.log('No course found. Creating a dummy course...');
            testCourse = new Course({
                title: 'Verify Registration Course',
                category: 'Testing',
                description: 'A course for verification'
            });
            await testCourse.save();
        }
        console.log(`Using course: ${testCourse.title} (${testCourse._id})`);

        // Ensure the batch has this course
        originalCourses = batch.courses || [];
        if (!batch.courses || batch.courses.length === 0) {
            batch.courses = [testCourse._id];
            await batch.save();
            console.log('Temporarily added course to batch');
        }

        // Clean up any old test data
        const testEmail = 'registertest@example.com';
        await Student.deleteOne({ email: testEmail });
        await BatchStudent.deleteMany({ studentId: { $exists: true }, batchId: batch._id });

        // 2. Simulate Registration Logic
        console.log('Simulating registration for RegisterTest@Example.com...');
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const inputEmail = '  RegisterTest@Example.com  ';
        const normalizedEmail = inputEmail.toLowerCase().trim();

        let courseIdValue = null;
        let courseName = "";
        let courseCategory = "";

        const populatedBatch = await Batch.findById(batch._id).populate('courses');
        console.log('Successfully populated courses without StrictPopulateError!');
        if (populatedBatch && populatedBatch.courses && populatedBatch.courses.length > 0) {
            const primaryCourse = populatedBatch.courses[0];
            courseIdValue = primaryCourse._id;
            courseName = primaryCourse.title;
            courseCategory = primaryCourse.category;
            console.log(`Associated Course: ${courseName} (${courseIdValue})`);
        }

        // Create student
        student = new Student({
            name: 'Register Test Student',
            email: normalizedEmail,
            passwordHash,
            phone: '1234567890',
            gender: 'Male',
            status: 'Active',
            courseName
        });
        await student.save();
        console.log('Student registered successfully.');

        // Assign to Batch
        if (batch._id && courseIdValue) {
            const batchStudent = new BatchStudent({
                batchId: batch._id,
                courseId: courseIdValue,
                studentId: student._id,
                enrollmentDate: new Date()
            });
            await batchStudent.save();
            console.log('Assigned student to batch in BatchStudent successfully.');
        }

        // 3. Verify BatchStudent document
        bsDoc = await BatchStudent.findOne({ studentId: student._id });
        console.log('BatchStudent document in DB:', bsDoc);
        if (bsDoc && bsDoc.courseId && bsDoc.enrollmentDate) {
            console.log('>>> BatchStudent verification: SUCCESS (has courseId and enrollmentDate)');
        } else {
            console.log('>>> BatchStudent verification: FAILED');
        }

        // 4. Simulate Login Logic
        console.log('Simulating login lookup with casing and space: "  REGISTERTEST@example.com  "');
        const loginEmailInput = '  REGISTERTEST@example.com  ';
        const loginNormalized = loginEmailInput.toLowerCase().trim();

        const foundStudent = await Student.findOne({ email: loginNormalized });
        if (foundStudent) {
            console.log('Student found during login lookup!');
            const isMatch = await bcrypt.compare(password, foundStudent.passwordHash);
            console.log('Password comparison result:', isMatch ? 'SUCCESS (MATCH)' : 'FAILED');
            if (isMatch) {
                console.log('>>> Login simulation: SUCCESS');
            } else {
                console.log('>>> Login simulation: FAILED (Password mismatch)');
            }
        } else {
            console.log('>>> Login simulation: FAILED (Student not found)');
        }

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        // Clean up test documents
        if (student) {
            await Student.deleteOne({ _id: student._id });
            console.log('Deleted test student');
        }
        if (bsDoc) {
            await BatchStudent.deleteOne({ _id: bsDoc._id });
            console.log('Deleted BatchStudent assignment');
        }
        // Restore original courses on batch
        if (batch && originalCourses.length === 0) {
            batch.courses = [];
            await batch.save();
            console.log('Restored batch courses');
        }
        mongoose.connection.close();
    }
};

run();
