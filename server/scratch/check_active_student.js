const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const Course = require('../models/Course');

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

const checkStudent = async () => {
    await connectDB();
    try {
        const students = await Student.find({});
        console.log('\n--- Enrolled Students in DB ---');
        let count = 0;
        for (const s of students) {
            if (s.courses && s.courses.length > 0) {
                count++;
                console.log(`Name: ${s.name}`);
                console.log(`  Email: ${s.email}`);
                console.log(`  Plan Tier: ${s.planTier}`);
                console.log(`  Enrolled Courses: ${s.courses.length}`);
                for (const cId of s.courses) {
                    const course = await Course.findById(cId, 'title');
                    console.log(`    - Course ID: ${cId} (${course ? course.title : 'Not Found'})`);
                }
            }
        }
        if (count === 0) {
            console.log('No students have enrolled courses.');
        }
        console.log('-------------------------------\n');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

checkStudent();
