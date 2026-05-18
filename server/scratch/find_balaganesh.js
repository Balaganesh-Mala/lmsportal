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

const findBalaganesh = async () => {
    await connectDB();
    try {
        const student = await Student.findOne({ name: /Balaganesh/i });
        if (student) {
            console.log('Found Balaganesh:', {
                id: student._id,
                name: student.name,
                email: student.email,
                currentStreak: student.currentStreak,
                highestStreak: student.highestStreak,
                lastActiveDate: student.lastActiveDate
            });
        } else {
            console.log('Balaganesh Mala not found by name filter.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

findBalaganesh();
