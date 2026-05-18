require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Batch = require('./models/Batch');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/LMS_Portal';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for seeding');
    } catch (err) {
        console.error('Database connection failed', err);
        process.exit(1);
    }
};

const subjects = [
    { title: 'English', description: 'English Literature and Grammar', overview: 'Comprehensive English language learning', duration: '1 Year', fee: 1000, skillLevel: 'Beginner', isPublished: true },
    { title: 'Hindi', description: 'Hindi Literature and Grammar', overview: 'Comprehensive Hindi language learning', duration: '1 Year', fee: 1000, skillLevel: 'Beginner', isPublished: true },
    { title: 'Telugu', description: 'Telugu Regional Language', overview: 'Comprehensive Telugu language learning', duration: '1 Year', fee: 1000, skillLevel: 'Beginner', isPublished: true },
    { title: 'Mathematics', description: 'General Mathematics', overview: 'Complete Math syllabus from basics to advanced', duration: '1 Year', fee: 1500, skillLevel: 'Beginner', isPublished: true },
    { title: 'Science', description: 'General Science including Physics, Chemistry, and Biology basics', overview: 'Foundational science concepts', duration: '1 Year', fee: 1500, skillLevel: 'Beginner', isPublished: true },
    { title: 'Social Studies', description: 'History, Geography, and Civics', overview: 'Understanding the world and history', duration: '1 Year', fee: 1000, skillLevel: 'Beginner', isPublished: true },
    { title: 'Computer Science', description: 'Basics of Computers and Programming', overview: 'Intro to computing and coding', duration: '1 Year', fee: 1500, skillLevel: 'Beginner', isPublished: true },
    { title: 'Physics', description: 'Advanced Physics for Higher Secondary', overview: 'In-depth Physics principles', duration: '1 Year', fee: 2000, skillLevel: 'Advanced', isPublished: true },
    { title: 'Chemistry', description: 'Advanced Chemistry for Higher Secondary', overview: 'In-depth Chemistry principles', duration: '1 Year', fee: 2000, skillLevel: 'Advanced', isPublished: true },
    { title: 'Biology', description: 'Advanced Biology for Higher Secondary', overview: 'In-depth Biology principles', duration: '1 Year', fee: 2000, skillLevel: 'Advanced', isPublished: true },
    { title: 'Accountancy', description: 'Commerce and Accountancy', overview: 'Financial accounting principles', duration: '1 Year', fee: 2000, skillLevel: 'Advanced', isPublished: true },
    { title: 'Business Studies', description: 'Business Management and Studies', overview: 'Principles of business management', duration: '1 Year', fee: 1500, skillLevel: 'Advanced', isPublished: true },
    { title: 'Economics', description: 'Micro and Macro Economics', overview: 'Study of economies and markets', duration: '1 Year', fee: 1500, skillLevel: 'Advanced', isPublished: true }
];

const classesConfig = [
    { name: '4th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies'] },
    { name: '5th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies'] },
    { name: '6th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'] },
    { name: '7th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'] },
    { name: '8th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'] },
    { name: '9th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'] },
    { name: '10th Class', subjects: ['English', 'Hindi', 'Telugu', 'Mathematics', 'Science', 'Social Studies', 'Computer Science'] },
    { name: '11th Class (Science)', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
    { name: '11th Class (Commerce)', subjects: ['English', 'Mathematics', 'Accountancy', 'Business Studies', 'Economics'] },
    { name: '12th Class (Science)', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
    { name: '12th Class (Commerce)', subjects: ['English', 'Mathematics', 'Accountancy', 'Business Studies', 'Economics'] }
];

const seedData = async () => {
    await connectDB();

    try {
        console.log('Seeding subjects (Courses)...');
        const createdSubjects = {};

        for (const sub of subjects) {
            let course = await Course.findOne({ title: sub.title });
            if (!course) {
                course = await Course.create(sub);
                console.log(`Created Subject: ${sub.title}`);
            } else {
                console.log(`Subject already exists: ${sub.title}`);
            }
            createdSubjects[sub.title] = course._id;
        }

        console.log('\nSeeding Classes (Batches)...');

        for (const cls of classesConfig) {
            let batch = await Batch.findOne({ name: cls.name });
            const courseIds = cls.subjects.map(s => createdSubjects[s]);

            if (!batch) {
                await Batch.create({
                    name: cls.name,
                    status: 'active',
                    courses: courseIds,
                    maxStudents: 60,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                });
                console.log(`Created Class (Batch): ${cls.name} with subjects: ${cls.subjects.join(', ')}`);
            } else {
                // Update existing batch with the courses array
                batch.courses = courseIds;
                await batch.save();
                console.log(`Updated existing Class (Batch): ${cls.name}`);
            }
        }

        console.log('\nSeeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
