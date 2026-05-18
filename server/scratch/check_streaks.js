const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

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

const checkStreaks = async () => {
    await connectDB();
    try {
        const students = await Student.find({}, 'name email currentStreak highestStreak lastActiveDate');
        console.log('--- Student Streaks ---');
        students.forEach(s => {
            console.log(`Name: ${s.name}, Email: ${s.email}, Current Streak: ${s.currentStreak}, Highest Streak: ${s.highestStreak}, Last Active: ${s.lastActiveDate}`);
        });
        console.log('-----------------------');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

checkStreaks();
