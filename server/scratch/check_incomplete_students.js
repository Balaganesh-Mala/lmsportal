const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const incomplete = await Student.find({
            $or: [
                { address: { $exists: false } },
                { address: "" },
                { dob: { $exists: false } }
            ]
        }).sort({ _id: -1 }).limit(10);
        
        console.log('Incomplete students count:', incomplete.length);
        incomplete.forEach(s => {
            console.log(`Student ID: ${s._id}, Name: ${s.name}, Email: ${s.email}, dob: ${s.dob}, address: "${s.address}", CreatedAt: ${s.createdAt}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};
run();
