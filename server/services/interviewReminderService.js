const MockInterviewSchedule = require('../models/MockInterviewSchedule');
const Student = require('../models/Student');
const { sendEmail } = require('../utils/emailService');
const { sendPushToStudent } = require('../services/pushService');
const Setting = require('../models/Setting');

/**
 * Check for upcoming interviews and send reminders
 */
const checkAndSendInterviewReminders = async () => {
    try {
        const now = new Date();
        const settings = await Setting.findOne() || {};

        // 1. Fetch all Scheduled interviews for today and tomorrow
        const upcomingInterviews = await MockInterviewSchedule.find({
            status: 'Scheduled',
            date: { $gte: new Date(now.setHours(0,0,0,0)) }
        }).populate('studentId', 'name email');

        for (const interview of upcomingInterviews) {
            const student = interview.studentId;
            if (!student) continue;

            const interviewTime = new Date(`${interview.date.toISOString().split('T')[0]} ${interview.startTime}`);
            const diffInMinutes = (interviewTime - new Date()) / 60000;

            // --- 24 Hour Reminder ---
            if (diffInMinutes > 1435 && diffInMinutes <= 1445 && !interview.remindersSent.dayBefore) {
                await sendReminders(interview, student, '24 Hours', settings);
                interview.remindersSent.dayBefore = true;
                await interview.save();
            }

            // --- 1 Hour Reminder ---
            if (diffInMinutes > 55 && diffInMinutes <= 65 && !interview.remindersSent.hourBefore) {
                await sendReminders(interview, student, '1 Hour', settings);
                interview.remindersSent.hourBefore = true;
                await interview.save();
            }

            // --- 10 Minute Reminder ---
            if (diffInMinutes > 5 && diffInMinutes <= 15 && !interview.remindersSent.tenMinutesBefore) {
                await sendReminders(interview, student, '10 Minutes', settings);
                interview.remindersSent.tenMinutesBefore = true;
                await interview.save();
            }
        }
    } catch (error) {
        console.error('Error in interview reminder service:', error);
    }
};

/**
 * Helper to send both Email and Push
 */
const sendReminders = async (interview, student, timeFrame, settings) => {
    const subject = `Reminder: Your Mock Interview starts in ${timeFrame}!`;
    const message = `Your mock interview is scheduled for today at ${interview.startTime}.`;
    
    // 1. Email
    const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Interview Reminder</h2>
            <p>Hello ${student.name},</p>
            <p>This is a reminder that your mock interview starts in <strong>${timeFrame}</strong>.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 5px 0;"><strong>Time:</strong> ${interview.startTime}</p>
                <p style="margin: 5px 0;"><strong>Link:</strong> <a href="${interview.meetingLink}" style="color: #4f46e5; font-weight: bold;">Join Meeting Now</a></p>
            </div>
            <p>Please ensure you are in a quiet place with a stable internet connection.</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Sent by Smart Aspirants Automated Scheduler.</p>
        </div>
    `;

    try {
        await sendEmail(student.email, subject, emailBody);
        
        // 2. Browser Push
        await sendPushToStudent(student._id, {
            title: `Interview in ${timeFrame}!`,
            body: `Your session starts at ${interview.startTime}. Click to join.`,
            url: interview.meetingLink
        });

        // console.log(`[REMIDER] Sent ${timeFrame} alert to ${student.email}`);
    } catch (err) {
        console.error(`Failed to send ${timeFrame} reminder to ${student.email}:`, err);
    }
};

module.exports = {
    checkAndSendInterviewReminders
};
