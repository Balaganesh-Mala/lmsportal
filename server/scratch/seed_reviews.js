const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Review = require('../models/Review');

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

const seedReviews = async () => {
    await connectDB();
    try {
        // Clear any existing reviews to prevent bloating
        await Review.deleteMany({});
        console.log('🧹 Cleared existing reviews.');

        const reviews = [
            {
                studentName: 'Aravind Swamy',
                courseTaken: 'Investment Banking Elite',
                role: 'Investment Analyst @ Goldman Sachs',
                rating: 5,
                reviewText: 'This course completely changed my career trajectory. The financial modeling modules and typing practice prep were critical in cracking my technical interviews!',
                studentImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
                isApproved: true
            },
            {
                studentName: 'Meera Deshmukh',
                courseTaken: 'Full Stack Financial Systems',
                role: 'Software Engineer @ Morgan Stanley',
                rating: 5,
                reviewText: 'The project-based learning is exceptional. The layout and Course Player features allowed me to learn complex architectures at my own pace.',
                studentImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
                isApproved: true
            },
            {
                studentName: 'Rahul Varma',
                courseTaken: 'Advanced Risk Management',
                role: 'Risk Consultant @ PwC',
                rating: 5,
                reviewText: 'Outstanding mentorship! The assignments and the custom mock quiz setup made the actual certifications a walk in the park. Highly recommended!',
                studentImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
                isApproved: true
            }
        ];

        await Review.insertMany(reviews);
        console.log('🎉 Successfully seeded 3 approved reviews in database!');
    } catch (err) {
        console.error('Error seeding reviews:', err);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedReviews();
