const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const dotenv = require('dotenv');

dotenv.config();

// Configure web-push
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:info@smartaspirants.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific student's registered devices
 * @param {string} studentId - The ID of the student
 * @param {Object} payload - Notification data (title, body, icon, url)
 */
const sendPushToStudent = async (studentId, payload) => {
    try {
        const subscriptions = await PushSubscription.find({ studentId });
        
        if (!subscriptions || subscriptions.length === 0) return;

        const notificationPayload = JSON.stringify({
            notification: {
                title: payload.title || 'Notification from Smart Aspirants',
                body: payload.body || '',
                icon: payload.icon || '/logo192.png',
                data: {
                    url: payload.url || '/'
                }
            }
        });

        const pushPromises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub.subscription, notificationPayload);
            } catch (error) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        });

        await Promise.allSettled(pushPromises);
    } catch (error) {
        console.error('Error in sendPushToStudent service:', error);
    }
};

/**
 * Send a push notification to multiple students
 * @param {Array} studentIds - Array of student IDs
 * @param {Object} payload - Notification data
 */
const sendPushToMultipleStudents = async (studentIds, payload) => {
    try {
        const subscriptions = await PushSubscription.find({ studentId: { $in: studentIds } });
        
        if (!subscriptions || subscriptions.length === 0) return;

        const notificationPayload = JSON.stringify({
            notification: {
                title: payload.title || 'Notification from Smart Aspirants',
                body: payload.body || '',
                icon: payload.icon || '/logo192.png',
                data: {
                    url: payload.url || '/'
                }
            }
        });

        const pushPromises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub.subscription, notificationPayload);
            } catch (error) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        });

        await Promise.allSettled(pushPromises);
    } catch (error) {
        console.error('Error in sendPushToMultipleStudents service:', error);
    }
};

/**
 * Broadcast a push notification to all unique subscribed students
 * @param {Object} payload - Notification data
 */
const broadcastPushToAllStudents = async (payload) => {
    try {
        const subscriptions = await PushSubscription.find({});
        
        if (!subscriptions || subscriptions.length === 0) return;

        const notificationPayload = JSON.stringify({
            notification: {
                title: payload.title || 'Notification from Smart Aspirants',
                body: payload.body || '',
                icon: payload.icon || '/logo192.png',
                data: {
                    url: payload.url || '/'
                }
            }
        });

        const pushPromises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub.subscription, notificationPayload);
            } catch (error) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        });

        await Promise.allSettled(pushPromises);
    } catch (error) {
        console.error('Error in broadcastPushToAllStudents service:', error);
    }
};

module.exports = {
    sendPushToStudent,
    sendPushToMultipleStudents,
    broadcastPushToAllStudents
};
