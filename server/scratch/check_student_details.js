const mongoose = require('mongoose');
const Student = require('../models/Student');
const BatchStudent = require('../models/BatchStudent');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const student = await Student.findOne({ email: 'balaganeshmalaa@gmail.com' });
        console.log('Student:', JSON.stringify(student, null, 2));

        if (student) {
            const batchStudent = await BatchStudent.findOne({ studentId: student._id });
            console.log('BatchStudent Assignment:', JSON.stringify(batchStudent, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};
run();
