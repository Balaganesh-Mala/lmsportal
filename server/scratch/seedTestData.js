const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');
const TopicContent = require('../models/TopicContent');
const HiringTest = require('../models/HiringTest');
const Student = require('../models/Student');

const MONGODB_URI = process.env.MONGO_URI;

const seedTestData = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // 1. Find Balaganesh Mala to ensure student exists
        let student = await Student.findOne({ email: 'malabalaganesh@gmail.com' });
        if (!student) {
            console.log('Student malabalaganesh@gmail.com not found. Creating student first...');
            student = new Student({
                name: 'Balaganesh Mala',
                email: 'malabalaganesh@gmail.com',
                passwordHash: '$2b$10$wE960pPkW1v4zK4b.d9hQOH.vD1c1e09X.J3p.t2f3Wp3M9yU8m6i', // hashed 'password123'
                planTier: 'Intermediate',
                isSubscribed: true,
                courseName: 'Dummy React Course for Testing'
            });
            await student.save();
        } else {
            console.log('Found active student:', student.name);
            student.courseName = 'Dummy React Course for Testing';
            // Set tier to Intermediate (corresponds to Gold level in CoursePlayer)
            student.planTier = 'Intermediate';
            student.isSubscribed = true;
            await student.save();
            console.log('Updated student planTier to:', student.planTier, 'courseName to:', student.courseName);
        }

        // 2. Clean up any existing course named 'Dummy React Course for Testing'
        const existingCourse = await Course.findOne({ title: 'Dummy React Course for Testing' });
        if (existingCourse) {
            console.log('Cleaning up existing dummy course and related data...');
            const modules = await Module.find({ courseId: existingCourse._id });
            const moduleIds = modules.map(m => m._id);
            const topics = await Topic.find({ moduleId: { $in: moduleIds } });
            const topicIds = topics.map(t => t._id);

            await TopicContent.deleteMany({ topicId: { $in: topicIds } });
            await Topic.deleteMany({ moduleId: { $in: moduleIds } });
            await Module.deleteMany({ courseId: existingCourse._id });
            await Course.deleteOne({ _id: existingCourse._id });
            console.log('Cleanup finished.');
        }

        // 3. Create fresh course
        const course = new Course({
            title: 'Dummy React Course for Testing',
            overview: 'Learn and test Video milestones, MCQ progression rules, and Document completion validations with integrated confetti paper blasts!',
            description: 'This is the ultimate sandbox course designed specifically for verification and feature testing.',
            duration: '4 Hours',
            fee: '0',
            skillLevel: 'Beginner',
            pricingType: 'free'
        });
        await course.save();
        console.log('Created Course:', course.title, `(_id: ${course._id})`);

        // 4. Create Module
        const moduleDoc = new Module({
            courseId: course._id,
            title: 'Module 1: React Gating & Progression Sandbox',
            order: 1
        });
        await moduleDoc.save();
        console.log('Created Module:', moduleDoc.title, `(_id: ${moduleDoc._id})`);

        // 5. Create Topic
        const topic = new Topic({
            moduleId: moduleDoc._id,
            title: 'Topic 1: React Hook Basics & Testing Suite',
            videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', // Real high quality React beginner tutorial
            description: 'Watch the React fundamentals video to trigger the 90%+ completion confetti blast! Navigate the tabs below to test Quizzes, PDF Documents, and Tasks.',
            duration: 15,
            order: 1
        });
        await topic.save();
        console.log('Created Topic:', topic.title, `(_id: ${topic._id})`);

        // 6. Create Quizzes (HiringTests)
        // Quiz 1: Basic Tier
        const quiz1 = new HiringTest({
            title: 'Practice Quiz 1: React Basics (Basic Tier)',
            type: 'mcq',
            questions: [
                {
                    questionText: 'What is React?',
                    options: ['A front-end UI library developed by Facebook', 'A relational database', 'An operating system', 'A web browser'],
                    correctAnswers: ['A front-end UI library developed by Facebook'],
                    isMultiple: false
                },
                {
                    questionText: 'What syntax extension does React use to write HTML-like markup?',
                    options: ['XML', 'JSX (JavaScript XML)', 'YAML', 'JSON'],
                    correctAnswers: ['JSX (JavaScript XML)'],
                    isMultiple: false
                }
            ],
            instructions: 'Answer all questions. Passing score is 75%.'
        });
        await quiz1.save();

        // Quiz 2: Premium Tier
        const quiz2 = new HiringTest({
            title: 'Practice Quiz 2: React Hook Fundamentals (Premium Tier)',
            type: 'mcq',
            questions: [
                {
                    questionText: 'Which React hook is commonly used to manage local component state?',
                    options: ['useEffect', 'useState', 'useContext', 'useRef'],
                    correctAnswers: ['useState'],
                    isMultiple: false
                },
                {
                    questionText: 'Which hook should you run to fetch API data or perform manual DOM updates?',
                    options: ['useMemo', 'useReducer', 'useEffect', 'useCallback'],
                    correctAnswers: ['useEffect'],
                    isMultiple: false
                }
            ],
            instructions: 'Answer hook questions. Passing score is 75%.'
        });
        await quiz2.save();

        // Quiz 3: Gold Tier
        const quiz3 = new HiringTest({
            title: 'Practice Quiz 3: Advanced State Management (Gold/Intermediate Tier)',
            type: 'mcq',
            questions: [
                {
                    questionText: 'What function is called in Redux to send an action to the store?',
                    options: ['store.subscribe', 'store.dispatch', 'store.getState', 'store.replaceReducer'],
                    correctAnswers: ['store.dispatch'],
                    isMultiple: false
                }
            ],
            instructions: 'Intermediate/Gold tier state management evaluation.'
        });
        await quiz3.save();

        // Quiz 4: Platinum Tier (Locked for Intermediate student)
        const quiz4 = new HiringTest({
            title: 'Practice Quiz 4: High-Performance Optimization (Platinum Tier)',
            type: 'mcq',
            questions: [
                {
                    questionText: 'Which hook helps prevent unnecessary child component rerenders by memoizing callbacks?',
                    options: ['useCallback', 'useMemo', 'useRef', 'useEffect'],
                    correctAnswers: ['useCallback'],
                    isMultiple: false
                }
            ],
            instructions: 'Platinum tier performance evaluation.'
        });
        await quiz4.save();

        console.log('Quizzes created.');

        // 7. Create TopicContent to link Quizzes and Assignments
        const topicContent = new TopicContent({
            topicId: topic._id,
            mcqTests: [
                {
                    testId: quiz1._id,
                    enabled: true,
                    requiredTier: 'Basic'
                },
                {
                    testId: quiz2._id,
                    enabled: true,
                    requiredTier: 'Premium'
                },
                {
                    testId: quiz3._id,
                    enabled: true,
                    requiredTier: 'Gold' // Gold is allowed in TopicContent schema
                },
                {
                    testId: quiz4._id,
                    enabled: true,
                    requiredTier: 'Platinum' // Level 4 / Locked for Intermediate student
                }
            ],
            assignments: [
                {
                    title: 'Dummy Task 1: Code a Counter Component',
                    description: 'Build a simple React component containing a counter with Increment and Decrement buttons.',
                    requiredTier: 'Basic'
                },
                {
                    title: 'Download React Cheatsheet (PDF - Basic)',
                    questionUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // A real sample PDF URL so iframe loads or downloads successfully
                    requiredTier: 'Basic'
                },
                {
                    title: 'Download Premium Hooks Architecture (PDF - Premium)',
                    questionUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    requiredTier: 'Premium'
                },
                {
                    title: 'Download Platinum Performance Tuning Guidelines (PDF - Platinum)',
                    questionUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    requiredTier: 'Platinum' // Gated under Platinum (Locked!)
                }
            ]
        });
        await topicContent.save();
        console.log('Created TopicContent with quizzes, documents, and tasks successfully linked!');

        console.log('\n======================================================');
        console.log('🌟 Sandbox Testing Course Seeding Completed Successfully! 🌟');
        console.log('======================================================');
        console.log('You can now log in to the student portal with:');
        console.log('Email: malabalaganesh@gmail.com');
        console.log('Password: password123');
        console.log('Course: Dummy React Course for Testing');
        console.log('Active Tier Assigned: Intermediate (equivalent to Gold)');
        console.log('Features Available to Test:');
        console.log('1. Video Confetti Blast: Play the topic video to 90%+ or click mark completed.');
        console.log('2. Quiz 1 (Basic), Quiz 2 (Premium), Quiz 3 (Gold/Intermediate) are accessible.');
        console.log('3. Quiz 4 is locked with a Platinum padlock (locks validation works!).');
        console.log('4. Progress Sync: MCQ progress is ONLY completed when all 3 accessible quizzes are passed.');
        console.log('5. Review Answer filtering: Try failing a quiz to see only wrong questions and correct answers revealed.');
        console.log('6. PDF downloads for Basic/Premium are open. Platinum PDF is fully gated/locked.');
        console.log('======================================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding test data:', error);
        process.exit(1);
    }
};

seedTestData();
