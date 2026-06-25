const socketIo = require('socket.io');
const SupportMessage = require('../models/SupportMessage');

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: [
                'http://localhost:5173', 
                'http://localhost:5174',
                'http://localhost:5175',
                'http://localhost:5176',
                'https://student.smartaspirants.com',
                'https://smartaspirants.com',
                'https://learning.smartaspirants.com',
                'https://admin.smartaspirants.com',
                'https://trainer.smartaspirants.com'
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a student-specific room
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        // Handle sending messages
        socket.on('sendMessage', async (data) => {
            const { studentId, adminId, sender, message, category } = data;

            try {
                // Persist to DB
                const newMessage = new SupportMessage({
                    student: studentId,
                    admin: adminId || null,
                    sender,
                    message,
                    category: category || 'general'
                });
                await newMessage.save();

                if (sender !== 'admin') {
                    // Student or Trainer message:
                    // 1. Send 'message' only to the sender's own room (for their chat widget)
                    io.to(studentId).emit('message', newMessage);
                    // 2. Notify admins via new_inquiry (with full message for display + sidebar update)
                    io.to('admin_inbox').emit('new_inquiry', {
                        studentId,
                        message: newMessage
                    });
                } else {
                    // Admin message:
                    // Send 'message' only to the inquirer's room (admin doesn't need an echo back)
                    io.to(studentId).emit('message', newMessage);
                    // Also notify admin_inbox so sidebar last message updates
                    io.to('admin_inbox').emit('admin_sent', {
                        studentId,
                        message: newMessage
                    });
                }
            } catch (err) {
                console.error('Socket message error:', err);
            }
        });

        // Admin joining the admin dashboard room
        socket.on('join_admin', () => {
            socket.join('admin_inbox');
            console.log('Admin joined inbox room');
        });

        // Handle ending chat
        socket.on('end_chat_session', (studentId) => {
            io.to(studentId).emit('chat_ended_by_admin');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
};

module.exports = { initSocket };
