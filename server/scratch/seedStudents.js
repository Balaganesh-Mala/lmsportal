const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const BatchStudent = require('../models/BatchStudent');

const MONGODB_URI = process.env.MONGO_URI;

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Ananya', 'Aadhya', 'Saanvi', 'Kavya', 'Dhruv', 'Kabir', 'Rohan', 'Neha', 'Pooja', 'Rahul', 'Amit', 'Sneha', 'Riya', 'Karan'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Rao', 'Gupta', 'Desai', 'Joshi', 'Mehta', 'Nair', 'Verma', 'Kapoor', 'Iyer', 'Choudhury', 'Bose', 'Das', 'Sen', 'Dutta', 'Shah'];

const seedStudents = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // Find the "class-4" batch
        const batch = await Batch.findOne({ name: { $regex: /class[\s-]?4/i } });
        
        if (!batch) {
            console.error('Could not find a batch with name matching "class-4". Please ensure it exists.');
            process.exit(1);
        }

        console.log(`Found batch: ${batch.name} (${batch._id})`);
        console.log(`Course ID: ${batch.courseId}`);

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        const trialEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

        let createdCount = 0;

        for (let i = 1; i <= 100; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const email = `dummy${Date.now()}${i}@example.com`;
            const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
            
            const student = new Student({
                name: `${firstName} ${lastName}`,
                email,
                phone,
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                dob: new Date(new Date().setFullYear(2010 - Math.floor(Math.random() * 5))),
                address: '123 Dummy St',
                city: 'Hyderabad',
                district: 'Telangana',
                collegeName: 'Dummy Public School',
                courseName: 'Class 4 Mathematics', // Placeholder
                courseCategory: 'School',
                passwordHash,
                profilePicture: '',
                status: 'Active',
                trialEndsAt,
                isSubscribed: false
            });

            await student.save();

            const batchStudent = new BatchStudent({
                batchId: batch._id,
                courseId: batch.courseId,
                studentId: student._id,
                joinedAt: new Date()
            });

            await batchStudent.save();
            createdCount++;
            
            if (i % 20 === 0) {
                console.log(`Created ${createdCount} students...`);
            }
        }

        console.log(`Successfully added ${createdCount} dummy students to ${batch.name}!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding students:', error);
        process.exit(1);
    }
};

seedStudents();
