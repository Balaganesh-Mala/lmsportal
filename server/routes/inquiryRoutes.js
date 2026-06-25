const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const Course = require('../models/Course');
const Setting = require('../models/Setting');
const { sendEmail } = require('../utils/emailService');
const { brochureDownloadTemplate, syllabusDownloadTemplate, feeAndCurriculumTemplate } = require('../templates/emailTemplates');

// @route   POST /api/inquiries
// @desc    Create a new inquiry
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, courseInterested, message, source, courseId } = req.body;

        const newInquiry = new Inquiry({
            name,
            email,
            phone,
            courseInterested,
            message,
            source: source || 'contact_form'
        });

        const inquiry = await newInquiry.save();

        if (courseId && process.env.MAIL_SENDER_EMAIL) {
            try {
                const [course, settings] = await Promise.all([
                    Course.findById(courseId),
                    Setting.findOne()
                ]);
                
                if (course) {
                    let htmlContent = '';
                    let subject = '';

                    const templateSettings = settings || {};

                    if (source === 'brochure_download') {
                        subject = `Your Course Brochure: ${course.title} - Smart Aspirants`;
                        htmlContent = brochureDownloadTemplate(name, course.title, course.brochurePdf?.url || '', templateSettings);
                    } else if (source === 'syllabus_download') {
                        subject = `Your Course Syllabus: ${course.title} - Smart Aspirants`;
                        htmlContent = syllabusDownloadTemplate(name, course.title, course.syllabusPdf?.url || '', templateSettings);
                    } else if (source === 'quote_popup') {
                        // Quote popup is for "Get Fee & Curriculum"
                        subject = `Fee & Curriculum Details: ${course.title} - Smart Aspirants`;
                        htmlContent = feeAndCurriculumTemplate(name, course.title, course.fee, course.syllabusPdf?.url || course.brochurePdf?.url || '', templateSettings);
                    }

                    if (htmlContent && subject) {
                        await sendEmail(email, subject, htmlContent);
                        console.log(`✅ Inquiry response email sent to ${email} for source: ${source}`);
                    } else {
                        console.log(`⚠️ No email sent for source: ${source}. Content or subject empty.`);
                    }
                } else {
                    console.log(`⚠️ Course with ID ${courseId} not found. Skipping inquiry email.`);
                }
            } catch (emailErr) {
                console.error("❌ Failed to send inquiry response email:", emailErr);
            }
        } else {
            if (!courseId) console.log(`⚠️ No courseId provided for inquiry. Skipping email.`);
            if (!process.env.MAIL_SENDER_EMAIL) console.log(`⚠️ MAIL_SENDER_EMAIL not set in .env. Skipping email.`);
        }

        res.status(201).json(inquiry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries
// @access  Public (Should be Admin only)
router.get('/', async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete an inquiry
// @access  Public (Should be Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ msg: 'Inquiry not found' });
        }

        await inquiry.deleteOne();
        res.json({ msg: 'Inquiry removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Inquiry not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/inquiries/:id
// @desc    Update inquiry status
// @access  Public (Should be Admin only)
router.patch('/:id', async (req, res) => {
    try {
        const { status, remarks } = req.body;
        
        const inquiry = await Inquiry.findById(req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({ msg: 'Inquiry not found' });
        }

        if (status !== undefined) inquiry.status = status;
        if (remarks !== undefined) inquiry.remarks = remarks;

        await inquiry.save();

        res.json(inquiry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
