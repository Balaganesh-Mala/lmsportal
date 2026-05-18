/**
 * seed_quiz_assignment.js
 * Adds dummy MCQ quiz + assignment to the first 2 topics found in the DB.
 * Run with: node seed_quiz_assignment.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const HiringTest = require('./models/HiringTest');
const TopicContent = require('./models/TopicContent');
const Topic = require('./models/Topic');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── 1. Find first 3 topics ──────────────────────────────────────
    const topics = await Topic.find({}).limit(3).lean();
    if (topics.length === 0) {
        console.error('❌ No topics found. Run seed_videos.js first.');
        process.exit(1);
    }
    console.log(`Found ${topics.length} topics to seed.`);

    // ── 2. Create dummy MCQ HiringTest ──────────────────────────────
    const mcqTest = await HiringTest.create({
        title: 'Investment Banking Basics Quiz',
        type: 'mcq',
        instructions: 'Answer all questions. Each question is timed at 30 seconds.',
        questions: [
            {
                questionText: 'What does IPO stand for in investment banking?',
                options: ['Initial Public Offering', 'Internal Portfolio Operation', 'Integrated Payment Order', 'International Profit Objective'],
                correctAnswers: ['Initial Public Offering'],
                isMultiple: false
            },
            {
                questionText: 'Which of the following are functions of an investment bank?',
                options: ['Underwriting securities', 'Retail banking', 'Mergers & Acquisitions advisory', 'Insurance sales'],
                correctAnswers: ['Underwriting securities', 'Mergers & Acquisitions advisory'],
                isMultiple: true
            },
            {
                questionText: 'What is the "buy side" in investment banking?',
                options: [
                    'Firms that buy and manage investments (hedge funds, pension funds)',
                    'Firms that issue and sell securities',
                    'Retail customers purchasing stocks',
                    'Government treasury departments'
                ],
                correctAnswers: ['Firms that buy and manage investments (hedge funds, pension funds)'],
                isMultiple: false
            },
            {
                questionText: 'What does DCF stand for in financial modeling?',
                options: ['Discounted Cash Flow', 'Direct Capital Funding', 'Debt Coverage Factor', 'Diversified Cash Formula'],
                correctAnswers: ['Discounted Cash Flow'],
                isMultiple: false
            },
            {
                questionText: 'Which financial statement shows a company\'s assets, liabilities and equity?',
                options: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Statement of Retained Earnings'],
                correctAnswers: ['Balance Sheet'],
                isMultiple: false
            }
        ]
    });
    console.log(`✅ Created MCQ test: "${mcqTest.title}" (${mcqTest._id})`);

    // ── 3. Attach MCQ to Topic 1, Assignment to Topic 2, both to Topic 3 ──
    const seedJobs = [
        {
            topic: topics[0],
            data: {
                mcqTest: { testId: mcqTest._id, enabled: true },
                tasks: [],
                assignments: []
            },
            label: 'MCQ only'
        },
        topics[1] ? {
            topic: topics[1],
            data: {
                mcqTest: { testId: null, enabled: false },
                tasks: [],
                assignments: [
                    {
                        title: 'Analyze a Financial Statement',
                        questionUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf' // public sample PDF
                    }
                ]
            },
            label: 'Assignment only'
        } : null,
        topics[2] ? {
            topic: topics[2],
            data: {
                mcqTest: { testId: mcqTest._id, enabled: true },
                tasks: [],
                assignments: [
                    {
                        title: 'Prepare a Deal Memo',
                        questionUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf'
                    }
                ]
            },
            label: 'MCQ + Assignment'
        } : null
    ].filter(Boolean);

    for (const job of seedJobs) {
        const existing = await TopicContent.findOne({ topicId: job.topic._id });
        if (existing) {
            await TopicContent.findByIdAndUpdate(existing._id, job.data);
            console.log(`🔄 Updated TopicContent for "${job.topic.title}" (${job.label})`);
        } else {
            await TopicContent.create({ topicId: job.topic._id, ...job.data });
            console.log(`✅ Created TopicContent for "${job.topic.title}" (${job.label})`);
        }
    }

    console.log('\n🎉 Seeding complete!');
    console.log('   Topic 1:', topics[0].title, '→ MCQ Practice sub-item');
    if (topics[1]) console.log('   Topic 2:', topics[1].title, '→ Assignment sub-item');
    if (topics[2]) console.log('   Topic 3:', topics[2].title, '→ MCQ Practice + Assignment sub-items');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌ Seed error:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
