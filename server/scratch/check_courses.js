const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Module = require('../models/Module');
const TopicContent = require('../models/TopicContent');

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

const checkCourses = async () => {
    await connectDB();
    try {
        const courses = await Course.find({}, 'title');
        console.log('\n--- Courses ---');
        for (const c of courses) {
            console.log(`Course: ${c.title} (_id: ${c._id})`);
            const modules = await Module.find({ courseId: c._id });
            for (const m of modules) {
                console.log(`  Module: ${m.name} (_id: ${m._id})`);
                const topics = await Topic.find({ moduleId: m._id });
                for (const t of topics) {
                    console.log(`    Topic: ${t.title} (_id: ${t._id})`);
                    const content = await TopicContent.findOne({ topicId: t._id });
                    if (content) {
                        console.log(`      Content Doc Found:`);
                        console.log(`        Legacy MCQ Test: ${content.mcqTest?.testId ? 'Yes (' + content.mcqTest.testId + ', enabled: ' + content.mcqTest.enabled + ')' : 'No'}`);
                        console.log(`        Multiple MCQ Tests: ${content.mcqTests ? content.mcqTests.length : 0}`);
                        if (content.mcqTests && content.mcqTests.length > 0) {
                            content.mcqTests.forEach((q, idx) => {
                                console.log(`          [Quiz ${idx}] testId: ${q.testId}, tier: ${q.requiredTier}, enabled: ${q.enabled}`);
                            });
                        }
                        console.log(`        Tasks: ${content.tasks ? content.tasks.length : 0}`);
                        console.log(`        Assignments: ${content.assignments ? content.assignments.length : 0}`);
                        if (content.assignments && content.assignments.length > 0) {
                            content.assignments.forEach((a, idx) => {
                                console.log(`          [Doc ${idx}] title: ${a.title}, tier: ${a.requiredTier}`);
                            });
                        }
                    } else {
                        console.log(`      No Content Doc Found`);
                    }
                }
            }
        }
        console.log('----------------\n');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

checkCourses();
