const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TopicContent = require('../models/TopicContent');
const HiringTest = require('../models/HiringTest'); // Ensure model is registered

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

const checkDirect = async () => {
    await connectDB();
    try {
        let content = await TopicContent.findOne({ topicId: '69fdc951a16c93a823888020' });
        if (!content) {
            console.log('No topic content found for this topic ID.');
            return;
        }

        // Populate MCQ test if linked
        if (content.mcqTest?.testId) {
            await content.populate('mcqTest.testId');
        }

        // Populate multiple MCQ tests if present
        if (content.mcqTests && content.mcqTests.length > 0) {
            await content.populate('mcqTests.testId');
        }

        console.log('Populated TopicContent:', JSON.stringify(content, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.connection.close();
    }
};

checkDirect();
