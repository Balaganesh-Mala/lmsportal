const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

const dropIndex = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collection = db.collection('studentmcqattempts');

        console.log('Current indexes:');
        const indexesBefore = await collection.indexes();
        console.log(indexesBefore);

        // Check if studentId_1_topicId_1 exists, and drop it
        const indexExists = indexesBefore.some(idx => idx.name === 'studentId_1_topicId_1');
        if (indexExists) {
            console.log('Dropping index: studentId_1_topicId_1');
            await collection.dropIndex('studentId_1_topicId_1');
            console.log('Index studentId_1_topicId_1 dropped successfully!');
        } else {
            console.log('Index studentId_1_topicId_1 not found or already dropped.');
        }

        console.log('Re-creating correct unique index: studentId_1_topicId_1_testId_1');
        await collection.createIndex({ studentId: 1, topicId: 1, testId: 1 }, { unique: true });
        console.log('New unique compound index created successfully!');

        console.log('Updated indexes:');
        const indexesAfter = await collection.indexes();
        console.log(indexesAfter);

        mongoose.connection.close();
    } catch (err) {
        console.error('Error during index drop/migration:', err);
        mongoose.connection.close();
    }
};

dropIndex();
