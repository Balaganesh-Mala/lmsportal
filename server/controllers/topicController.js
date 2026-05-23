const Topic = require('../models/Topic');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Helper: Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder, resourceType = 'auto') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });
        fs.unlinkSync(filePath); // Delete local file
        return result;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
    }
};

// @desc    Create a new topic
// @route   POST /api/admin/topic/create
// @access  Admin
exports.createTopic = async (req, res) => {
    try {
        const { moduleId, title, description, duration, order, classDate, requiredTier } = req.body;

        if (!moduleId || !title || order === undefined) {
            return res.status(400).json({ message: 'Please provide moduleId, title and order' });
        }

        const topicData = {
            moduleId,
            title,
            description,
            duration,
            order,
            classDate,
            requiredTier: requiredTier || 'Basic',
            notes: []
        };

        // Handle Video (URL or File)
        if (req.body.videoUrl) {
             topicData.videoUrl = req.body.videoUrl;
             // No publicId for external URLs
        } else if (req.files && req.files['video']) {
            const videoPath = req.files['video'][0].path;
            const result = await uploadToCloudinary(videoPath, 'courses/topics/videos', 'video');
            topicData.videoUrl = result.secure_url;
            topicData.videoPublicId = result.public_id;
            // Auto-detect duration if possible? (Cloudinary returns duration, but we might want manual override)
            if (result.duration && !duration) {
                topicData.duration = Math.round(result.duration / 60); // seconds to minutes
            }
        }

        // Handle Notes Upload
        if (req.files && req.files['notes']) {
            for (const file of req.files['notes']) {
                const result = await uploadToCloudinary(file.path, 'courses/topics/notes', 'raw'); // 'raw' for PDFs
                topicData.notes.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    name: file.originalname,
                    type: 'file'
                });
            }
        }

        // Handle External Notes (Google Docs / PPTs)
        if (req.body.externalNotes) {
            try {
                const extNotes = typeof req.body.externalNotes === 'string' ? JSON.parse(req.body.externalNotes) : req.body.externalNotes;
                if (Array.isArray(extNotes)) {
                    extNotes.forEach(note => {
                        if (note.url && note.name) {
                            topicData.notes.push({
                                url: note.url,
                                name: note.name,
                                type: note.type || 'google_doc',
                                requiredTier: note.requiredTier || 'Basic'
                            });
                        }
                    });
                }
            } catch (pErr) {
                console.warn('Failed to parse externalNotes:', pErr);
            }
        }

        const topic = await Topic.create(topicData);
        res.status(201).json({ success: true, topic });

    } catch (err) {
        console.error('Error creating topic:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get topics for a module
// @route   GET /api/topics/:moduleId
// @access  Public
exports.getTopicsByModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const topics = await Topic.find({ moduleId }).sort({ order: 1 });
        res.json({ success: true, count: topics.length, topics });
    } catch (err) {
        console.error('Error fetching topics:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Update a topic
// @route   PUT /api/admin/topic/:id
// @access  Admin
exports.updateTopic = async (req, res) => {
    try {
        let topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        const { title, description, duration, order, classDate, keepVideo, keepNotes, videoUrl, requiredTier } = req.body;
        
        // Update basic fields
        if (title) topic.title = title;
        if (description) topic.description = description;
        if (duration) topic.duration = duration;
        if (order !== undefined) topic.order = order;
        if (classDate) topic.classDate = classDate;
        if (requiredTier) topic.requiredTier = requiredTier;

        // Handle Video Update (URL or File)
        if (videoUrl) {
             // If switching to URL, delete old Cloudinary video if exists
             if (topic.videoPublicId) {
                await cloudinary.uploader.destroy(topic.videoPublicId, { resource_type: 'video' });
                topic.videoPublicId = undefined;
            }
            topic.videoUrl = videoUrl;
        } else if (req.files && req.files['video']) {
            // Delete old video
            if (topic.videoPublicId) {
                await cloudinary.uploader.destroy(topic.videoPublicId, { resource_type: 'video' });
            }
            const result = await uploadToCloudinary(req.files['video'][0].path, 'courses/topics/videos', 'video');
            topic.videoUrl = result.secure_url;
            topic.videoPublicId = result.public_id;
        }

        // Handle Notes Update
        // If 'notes' files are uploaded, APPEND them.
        if (req.files && req.files['notes']) {
            for (const file of req.files['notes']) {
                const result = await uploadToCloudinary(file.path, 'courses/topics/notes', 'raw');
                topic.notes.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    name: file.originalname,
                    type: 'file'
                });
            }
        }

        // Handle External Notes Update (Append)
        if (req.body.externalNotes) {
            try {
                const extNotes = typeof req.body.externalNotes === 'string' ? JSON.parse(req.body.externalNotes) : req.body.externalNotes;
                if (Array.isArray(extNotes)) {
                    extNotes.forEach(note => {
                        if (note.url && note.name) {
                            topic.notes.push({
                                url: note.url,
                                name: note.name,
                                type: note.type || 'google_doc',
                                requiredTier: note.requiredTier || 'Basic'
                            });
                        }
                    });
                }
            } catch (pErr) {
                console.warn('Failed to parse externalNotes:', pErr);
            }
        }
        
        await topic.save();
        res.json({ success: true, topic });

    } catch (err) {
        console.error('Error updating topic:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Delete a topic
// @route   DELETE /api/admin/topic/:id
// @access  Admin
exports.deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        // Clean up Cloudinary
        if (topic.videoPublicId) {
            await cloudinary.uploader.destroy(topic.videoPublicId, { resource_type: 'video' });
        }
        if (topic.notes && topic.notes.length > 0) {
            for (const note of topic.notes) {
                if (note.publicId) {
                    await cloudinary.uploader.destroy(note.publicId, { resource_type: 'raw' });
                }
            }
        }

        await topic.deleteOne();
        res.json({ success: true, message: 'Topic deleted' });
    } catch (err) {
        console.error('Error deleting topic:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Delete a specific note from a topic
// @route   DELETE /api/admin/topic/:id/note/:noteId
// @access  Admin
exports.deleteTopicNote = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        const note = topic.notes.id(req.params.noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });

        if (note.publicId) {
             await cloudinary.uploader.destroy(note.publicId, { resource_type: 'raw' });
        }

        note.deleteOne(); // Mongoose subdocument remove
        await topic.save();

        res.json({ success: true, topic });
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
