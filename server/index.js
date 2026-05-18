const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Init Cron Jobs
const { startCronJobs } = require('./services/cronJobs');
startCronJobs();

// Auto-create uploads directory for multer if it doesn't exist (Hostinger deploy fix)
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', // Admin Panel
        'http://localhost:5175', // Potential Student Port
        'http://localhost:5176',
        'http://127.0.0.1:5173', 
        'http://127.0.0.1:5174',
        'http://localhost:5000',
        'http://187.127.138.157:5000/',
        'https://finwise-64g1.onrender.com',
        'https://finwise-student.vercel.app', // Student Portal Deployed
        'https://learning.finwisecareers.com', // Student Portal Production
        'http://finwisecareers.com',
        'https://finwisecareers.com',
        process.env.CLIENT_URL,
        process.env.ADMIN_URL,
        process.env.STUDENT_URL,
        'https://trainer.finwisecareers.com',
        'https://finwise-3tlb.vercel.app',
        'https://vapi.ai',
        'https://*.vapi.ai'
    ],
    credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/student-jobs', require('./routes/studentJobRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/demos', require('./routes/demoRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/run', require('./routes/runRoutes'));
app.use('/api/code', require('./routes/codeRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/typing', require('./routes/typingRoutes'));
app.use('/api/voice', require('./routes/voiceRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/trainer', require('./routes/trainerRoutes'));
app.use('/api/admin/trainers', require('./routes/adminTrainerRoutes'));
app.use('/api/admin/tests', require('./routes/adminTestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/meetings', require('./routes/adminMeetingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/topic-content', require('./routes/topicContentRoutes'));
app.use('/api/drip', require('./routes/dripRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/mock-interviews', require('./routes/mockInterviewRoutes'));
app.use('/api/mock-interview-settings', require('./routes/mockInterviewSettingsRoutes'));
app.use('/api/interview-schedules', require('./routes/interviewScheduleRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/study-materials', require('./routes/studyMaterialRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/subscription-plans', require('./routes/subscriptionPlanRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// Course Module Routes
app.use('/api', require('./routes/moduleRoutes'));
app.use('/api', require('./routes/topicRoutes'));
app.use('/api', require('./routes/progressRoutes'));
app.use('/api', require('./routes/commentRoutes'));

// Test Email Route
app.get('/api/test/email', async (req, res) => {
    try {
        const { sendEmail } = require('./utils/emailService');
        await sendEmail(
            process.env.MAIL_SENDER_EMAIL || 'info@wonew.in',
            'Test Email from Wonew (Hostinger)',
            '<h1>It Works!</h1><p>Hostinger SMTP is connected via Nodemailer.</p>'
        );
        res.json({ success: true, message: 'Test email sent!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('API is running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;

// Socket.io integration
const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./services/socketService');
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (Bound to 0.0.0.0)`);
});
