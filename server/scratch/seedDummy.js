const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const TopicContent = require('../models/TopicContent');
const HiringTest = require('../models/HiringTest');
const Batch = require('../models/Batch');

const MONGODB_URI = process.env.MONGO_URI;

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // 1. Create a dummy course
        const course = new Course({
            title: 'Dummy React Course for Testing',
            overview: 'This is a test course to check videos, quizzes, and assignments.',
            description: 'Learn the basics of React with dummy data.',
            duration: '2 Hours',
            fee: '500',
            skillLevel: 'Beginner',
            pricingType: 'free'
        });
        await course.save();
        console.log('Course created:', course._id);

        // 2. Create a module
        const moduleDoc = new Module({
            courseId: course._id,
            title: 'Module 1: Introduction',
            order: 1
        });
        await moduleDoc.save();
        console.log('Module created:', moduleDoc._id);

        // 3. Create a topic with the provided YouTube video
        const topic = new Topic({
            moduleId: moduleDoc._id,
            title: 'Topic 1: Watch this video',
            videoUrl: 'https://youtu.be/YyepU5ztLf4?si=hT8mlOWs66NNGHe-',
            description: 'Watch this YouTube video as requested.',
            duration: 10,
            order: 1
        });
        await topic.save();
        console.log('Topic created:', topic._id);

        // 4. Create an MCQ Quiz (HiringTest)
        const quiz = new HiringTest({
            title: 'Dummy Quiz on React',
            type: 'mcq',
            questions: [
                {
                    questionText: 'What is React?',
                    options: ['A UI library', 'A database', 'An operating system', 'A browser'],
                    correctAnswers: ['A UI library'],
                    isMultiple: false
                },
                {
                    questionText: 'Which language is used in React?',
                    options: ['Python', 'Java', 'JavaScript/JSX', 'C++'],
                    correctAnswers: ['JavaScript/JSX'],
                    isMultiple: false
                }
            ],
            instructions: 'Please answer these simple questions.'
        });
        await quiz.save();
        console.log('Quiz created:', quiz._id);

        // 5. Create TopicContent to link Quiz and Assignment
        const topicContent = new TopicContent({
            topicId: topic._id,
            mcqTest: {
                testId: quiz._id,
                enabled: true
            },
            assignments: [
                {
                    title: 'Dummy Assignment: Build a Component',
                    questionUrl: '',
                    questionPublicId: ''
                }
            ]
        });
        await topicContent.save();
        console.log('TopicContent created:', topicContent._id);

        // 6. Create a Batch for this course so the user can assign it or register for it
        const batch = new Batch({
            name: 'Dummy Testing Batch',
            courseId: course._id,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            maxStudents: 100,
            description: 'Batch for the dummy testing course.',
            status: 'active'
        });
        await batch.save();
        console.log('Batch created:', batch._id);

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedData();
