const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Student = require('../models/Student');

const MONGODB_URI = process.env.MONGO_URI;

const updateStudents = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // Fetch all students
        const students = await Student.find({});
        console.log(`Found ${students.length} students. Updating points and streaks...`);

        let updatedCount = 0;
        
        for (const student of students) {
            // Generate random points between 100 and 5000
            const randomPoints = Math.floor(Math.random() * 4900) + 100;
            // Generate random streak between 1 and 30
            const randomStreak = Math.floor(Math.random() * 30) + 1;
            // Highest streak is at least current streak
            const highestStreak = randomStreak + Math.floor(Math.random() * 10);
            
            student.points = randomPoints;
            student.currentStreak = randomStreak;
            student.highestStreak = highestStreak;
            student.lastActiveDate = new Date();

            await student.save();
            updatedCount++;
            
            if (updatedCount % 50 === 0) {
                console.log(`Updated ${updatedCount} students...`);
            }
        }

        console.log(`Successfully added points and streaks to ${updatedCount} students!`);
        process.exit(0);

    } catch (error) {
        console.error('Error updating students:', error);
        process.exit(1);
    }
};

updateStudents();
