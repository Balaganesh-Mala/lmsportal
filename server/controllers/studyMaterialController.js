const StudyMaterial = require('../models/StudyMaterial');
const BatchStudent = require('../models/BatchStudent');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { broadcastPushToAllStudents, sendPushToMultipleStudents } = require('../services/pushService');
const axios = require('axios');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Helper: Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true
        });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return result;
    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw err;
    }
};

// Helper: Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Cloudinary Delete Error:', err);
    }
};

// @desc    Create new study material
// @route   POST /api/study-materials
// @access  Private (Admin)
exports.createMaterial = async (req, res) => {
    try {
        const { targetBatches, targetStudents, ...otherData } = req.body;

        // Handle File Uploads (Cloudinary)
        let fileUrl = otherData.fileUrl;
        let filePublicId = "";
        let thumbnailUrl = "";
        let thumbnailPublicId = "";

        if (req.files) {
            if (req.files.file && req.files.file[0]) {
                const result = await uploadToCloudinary(req.files.file[0].path, 'study_materials/files');
                fileUrl = result.secure_url;
                filePublicId = result.public_id;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                const result = await uploadToCloudinary(req.files.thumbnail[0].path, 'study_materials/thumbnails');
                thumbnailUrl = result.secure_url;
                thumbnailPublicId = result.public_id;
            }
        }

        // Ensure target arrays are actual arrays
        const formattedBatches = Array.isArray(targetBatches) ? targetBatches : (targetBatches ? [targetBatches] : []);
        const formattedStudents = Array.isArray(targetStudents) ? targetStudents : (targetStudents ? [targetStudents] : []);

        const material = await StudyMaterial.create({
            ...otherData,
            requiredTier: otherData.requiredTier || 'Basic',
            fileUrl,
            filePublicId,
            thumbnailUrl,
            thumbnailPublicId,
            targetBatches: formattedBatches,
            targetStudents: formattedStudents,
            uploadedBy: req.user ? req.user._id : null
        });

        // --- Handle Notifications ---
        try {
            const notifTitle = `New Study Material: ${material.title}`;
            const notifMessage = `New ${material.type} material has been added. Check it out!`;
            const notifLink = '/materials';

            if (material.targetType === 'global') {
                // 1. Database Notifications
                const students = await Student.find({ status: 'Active' }).select('_id');
                if (students.length > 0) {
                    const dbNotifs = students.map(s => ({
                        recipient: s._id,
                        recipientModel: 'Student',
                        title: notifTitle,
                        message: notifMessage,
                        type: 'info',
                        link: notifLink
                    }));
                    await Notification.insertMany(dbNotifs, { ordered: false });
                }
                // 2. Push Notifications
                await broadcastPushToAllStudents({
                    title: notifTitle,
                    body: notifMessage,
                    url: notifLink
                });
            } else if (material.targetType === 'batch' && formattedBatches.length > 0) {
                // 1. Database Notifications
                const batchStudents = await BatchStudent.find({ 
                    batchId: { $in: formattedBatches },
                    status: 'active'
                }).select('studentId');
                
                const studentIds = [...new Set(batchStudents.map(bs => bs.studentId.toString()))];
                
                if (studentIds.length > 0) {
                    const dbNotifs = studentIds.map(sid => ({
                        recipient: sid,
                        recipientModel: 'Student',
                        title: notifTitle,
                        message: notifMessage,
                        type: 'info',
                        link: notifLink
                    }));
                    await Notification.insertMany(dbNotifs, { ordered: false });
                    
                    // 2. Push Notifications
                    await sendPushToMultipleStudents(studentIds, {
                        title: notifTitle,
                        body: notifMessage,
                        url: notifLink
                    });
                }
            } else if (material.targetType === 'individual' && formattedStudents.length > 0) {
                // 1. Database Notifications
                const dbNotifs = formattedStudents.map(sid => ({
                    recipient: sid,
                    recipientModel: 'Student',
                    title: notifTitle,
                    message: notifMessage,
                    type: 'info',
                    link: notifLink
                }));
                await Notification.insertMany(dbNotifs, { ordered: false });
                
                // 2. Push Notifications
                await sendPushToMultipleStudents(formattedStudents, {
                    title: notifTitle,
                    body: notifMessage,
                    url: notifLink
                });
            }
        } catch (notifErr) {
            console.error("Failed to send study material notifications:", notifErr);
        }

        res.status(201).json({ success: true, data: material });
    } catch (error) {
        console.error("Create Material Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update study material
// @route   PUT /api/study-materials/:id
// @access  Private (Admin)
exports.updateMaterial = async (req, res) => {
    try {
        let material = await StudyMaterial.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const { targetBatches, targetStudents, ...otherData } = req.body;

        // Handle File Updates
        if (req.files) {
            if (req.files.file && req.files.file[0]) {
                if (material.filePublicId) await deleteFromCloudinary(material.filePublicId);
                const result = await uploadToCloudinary(req.files.file[0].path, 'study_materials/files');
                otherData.fileUrl = result.secure_url;
                otherData.filePublicId = result.public_id;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                if (material.thumbnailPublicId) await deleteFromCloudinary(material.thumbnailPublicId);
                const result = await uploadToCloudinary(req.files.thumbnail[0].path, 'study_materials/thumbnails');
                otherData.thumbnailUrl = result.secure_url;
                otherData.thumbnailPublicId = result.public_id;
            }
        }

        // Ensure target arrays are actual arrays
        if (targetBatches !== undefined) {
             otherData.targetBatches = Array.isArray(targetBatches) ? targetBatches : (targetBatches ? [targetBatches] : []);
        }
        if (targetStudents !== undefined) {
             otherData.targetStudents = Array.isArray(targetStudents) ? targetStudents : (targetStudents ? [targetStudents] : []);
        }

        material = await StudyMaterial.findByIdAndUpdate(req.params.id, otherData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: material });
    } catch (error) {
        console.error("Update Material Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all materials (Admin view)
// @route   GET /api/study-materials
// @access  Private (Admin)
exports.getAllMaterials = async (req, res) => {
    try {
        const materials = await StudyMaterial.find()
            .populate('targetBatches', 'name')
            .populate('targetStudents', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: materials.length, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete material
// @route   DELETE /api/study-materials/:id
// @access  Private (Admin)
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        // Cleanup Cloudinary assets
        if (material.filePublicId) await deleteFromCloudinary(material.filePublicId);
        if (material.thumbnailPublicId) await deleteFromCloudinary(material.thumbnailPublicId);

        await material.deleteOne();
        res.status(200).json({ success: true, message: 'Material removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get materials for a specific student (Student Portal)
// @route   GET /api/study-materials/student/:studentId
// @access  Private (Student)
exports.getStudentMaterials = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Find the student's batch assignments
        const batchAssignments = await BatchStudent.find({ 
            studentId: studentId,
            status: 'active'
        }).select('batchId');

        const studentBatchIds = batchAssignments.map(ba => ba.batchId);
        
        const query = {
            $or: [
                { targetType: 'global' },
                { 
                    targetType: 'batch', 
                    targetBatches: { $in: studentBatchIds } 
                },
                { 
                    targetType: 'individual', 
                    targetStudents: studentId 
                }
            ]
        };

        const materials = await StudyMaterial.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: materials.length, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Securely proxy PDF bytes for direct viewing, defeating CORS and Google Drive limits
// @route   GET /api/study-materials/proxy-pdf
// @access  Private
exports.proxyPdf = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

        let fetchUrl = url;

        // Transform Google Drive viewer URL into a raw download URL
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
            const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                // If it's a document/spreadsheets/presentation, use the export format to get a PDF
                if (url.includes('/document/')) {
                    fetchUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
                } else if (url.includes('/presentation/')) {
                    fetchUrl = `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
                } else if (url.includes('/spreadsheets/')) {
                    fetchUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=pdf`;
                } else {
                    fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                }
            }
        }

        // Fetch streaming response
        const fetchPdfStream = async (targetUrl, confirmToken = '') => {
            const finalUrl = confirmToken ? `${targetUrl}&confirm=${confirmToken}` : targetUrl;
            return await axios({
                method: 'get',
                url: finalUrl,
                responseType: 'stream',
                validateStatus: status => status >= 200 && status < 400
            });
        };

        let response = await fetchPdfStream(fetchUrl);

        // Google Drive Virus warning boundary check for large files
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html') || contentType.includes('text/plain')) {
            const chunks = [];
            for await (const chunk of response.data) {
                 chunks.push(chunk);
            }
            const htmlContent = Buffer.concat(chunks).toString('utf-8');
            const tokenMatch = htmlContent.match(/confirm=([a-zA-Z0-9_-]+)/);
            
            if (tokenMatch) {
                const confirmToken = tokenMatch[1];
                response = await fetchPdfStream(fetchUrl, confirmToken);
            }
            // If it's not a confirm token but still HTML, it might be a login requirement or error
            else if (contentType.includes('text/html')) {
                 return res.status(502).json({ success: false, message: 'Source document is not publicly accessible or requires bypass.' });
            }
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.setHeader('Access-Control-Allow-Origin', '*');

        response.data.pipe(res);

    } catch (error) {
        console.error('PDF Proxy error:', error.message);
        res.status(502).json({ success: false, message: 'Failed to securely fetch document' });
    }
};
