const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const restoreStreak = async () => {
    await connectDB();
    try {
        const student = await Student.findOne({ name: /Balaganesh/i });
        if (student) {
            student.currentStreak = 22;
            student.highestStreak = 22;
            student.lastActiveDate = new Date(); // set to today so it doesn't reset on next load
            await student.save();
            console.log('Successfully restored streak for Balaganesh Mala:', {
                currentStreak: student.currentStreak,
                highestStreak: student.highestStreak,
                lastActiveDate: student.lastActiveDate
            });
        } else {
            console.log('Student not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

restoreStreak();
