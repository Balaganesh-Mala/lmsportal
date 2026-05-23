const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Topic = require('../models/Topic');
const TopicContent = require('../models/TopicContent');

dotenv.config();

const connectDB = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
};

const seedMultipleDocuments = async () => {
    await connectDB();
    try {
        // Find the first 3 topics in the DB
        const topics = await Topic.find({}).limit(3);
        if (topics.length === 0) {
            console.log('❌ No topics found in database. Run standard seeders first.');
            return;
        }

        console.log(`Found ${topics.length} topics. We will seed multiple documents for them.`);

        const assignmentsSet = [
            {
                title: '📌 Document 1: Financial Modeling Basics',
                questionUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf',
                requiredTier: 'Basic'
            },
            {
                title: '📌 Document 2: Advanced DCF Valuation Guide',
                questionUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf',
                requiredTier: 'Basic'
            },
            {
                title: '📌 Document 3: M&A Pitch Deck Framework',
                questionUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf',
                requiredTier: 'Basic'
            }
        ];

        for (const topic of topics) {
            let topicContent = await TopicContent.findOne({ topicId: topic._id });

            if (topicContent) {
                // Keep existing mcqTests if any, but replace or add multiple assignments
                topicContent.assignments = assignmentsSet;
                await topicContent.save();
                console.log(`✅ Updated TopicContent for "${topic.title}" with 3 documents.`);
            } else {
                // Create new TopicContent with 3 assignments
                await TopicContent.create({
                    topicId: topic._id,
                    assignments: assignmentsSet,
                    mcqTest: { testId: null, enabled: false },
                    tasks: []
                });
                console.log(`✅ Created TopicContent for "${topic.title}" with 3 documents.`);
            }
        }

        console.log('🎉 Seeding successfully completed! You now have multiple study documents in the first few topics.');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedMultipleDocuments();
