const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const run = async () => {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const collection = db.collection('batchstudents');
        const docs = await collection.find({}).limit(5).toArray();
        console.log('Sample raw batchstudents docs:');
        console.log(JSON.stringify(docs, null, 2));

        // Find one doc with isBonus: true
        const bonusDoc = await collection.findOne({ isBonus: true });
        console.log('Sample raw bonus batchstudent doc:');
        console.log(JSON.stringify(bonusDoc, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

run();
