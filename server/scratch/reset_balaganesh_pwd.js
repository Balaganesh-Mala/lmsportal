const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const resetPwd = async () => {
    await connectDB();
    try {
        const student = await Student.findOne({ email: 'malabalaganesh@gmail.com' });
        if (!student) {
            console.log('Student not found.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        student.passwordHash = await bcrypt.hash('password123', salt);
        await student.save();
        console.log('Password successfully reset for Balaganesh Mala to: password123');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

resetPwd();
