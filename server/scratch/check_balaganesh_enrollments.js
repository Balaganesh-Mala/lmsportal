const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const Course = require('../models/Course');
const BatchStudent = require('../models/BatchStudent');
const Batch = require('../models/Batch');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkEnrollments = async () => {
    await connectDB();
    try {
        const student = await Student.findOne({ email: 'malabalaganesh@gmail.com' });
        if (!student) {
            console.log('Student not found');
            return;
        }

        console.log('Student name:', student.name);
        console.log('Student courseName field:', student.courseName);

        const enrollments = await BatchStudent.find({ studentId: student._id }).populate({
            path: 'batchId',
            populate: { path: 'courses' }
        });

        console.log(`Found ${enrollments.length} BatchStudent enrollment documents:`);
        enrollments.forEach((e, idx) => {
            console.log(`Enrollment ${idx}:`);
            console.log(`  Batch Name: ${e.batchId ? e.batchId.name : 'No Batch'}`);
            if (e.batchId && e.batchId.courses) {
                console.log(`  Batch Courses:`);
                e.batchId.courses.forEach(c => {
                    console.log(`    - Course Title: ${c.title} (_id: ${c._id})`);
                });
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

checkEnrollments();
