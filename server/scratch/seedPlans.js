const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SubscriptionPlan = require('../models/SubscriptionPlan');

const MONGODB_URI = process.env.MONGO_URI;

const seedPlans = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing plans
        await SubscriptionPlan.deleteMany({});

        const plans = [
            {
                title: 'Olympiad Math Mastery - Grade 5 Weekday',
                type: 'monthly',
                duration: '1 Month',
                price: 2500,
                originalPrice: 3500,
                discountLabel: '28% OFF',
                badge: '',
                features: [
                    {
                        category: 'Class',
                        items: ['Class Start Date', 'Class Days & Timing', 'LIVE Online Class by Master Teachers']
                    },
                    {
                        category: 'After Class',
                        items: ['Assignments and Class notes', 'Digital study material (PDF)']
                    }
                ],
                order: 1
            },
            {
                title: 'Olympiad Math Mastery - Grade 5 Weekday',
                type: 'quarterly',
                duration: '3 Months',
                price: 6999,
                originalPrice: 10500,
                discountLabel: '33% OFF',
                badge: 'Most Popular',
                features: [
                    {
                        category: 'Class',
                        items: ['Class Start Date', 'Class Days & Timing', 'LIVE Online Class by Master Teachers']
                    },
                    {
                        category: 'After Class',
                        items: ['Assignments and Class notes', 'Digital study material (PDF)']
                    }
                ],
                order: 2
            },
            {
                title: 'Olympiad Math Mastery - Grade 5 Weekday',
                type: 'annually',
                duration: '12 Months',
                price: 19999,
                originalPrice: 42000,
                discountLabel: '52% OFF',
                badge: 'Best Value',
                features: [
                    {
                        category: 'Class',
                        items: ['Class Start Date', 'Class Days & Timing', 'LIVE Online Class by Master Teachers']
                    },
                    {
                        category: 'After Class',
                        items: ['Assignments and Class notes', 'Digital study material (PDF)']
                    }
                ],
                order: 3
            }
        ];

        await SubscriptionPlan.insertMany(plans);
        console.log('Subscription plans seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    }
};

seedPlans();
