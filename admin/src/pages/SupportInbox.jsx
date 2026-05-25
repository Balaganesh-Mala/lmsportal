import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
    Search,
    Send,
    User,
    MessageSquare,
    Clock,
    CheckCheck,
    Loader2,
    Headset,
    MoreVertical,
    ChevronLeft,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const SupportInbox = () => {
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null); // Full chat object
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showStudentCard, setShowStudentCard] = useState(false);



    const messagesEndRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const admin = React.useMemo(() => JSON.parse(localStorage.getItem('adminUser')), []);

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const showBrowserNotification = (title, body, icon = '/favicon.ico') => {
        if ('Notification' in window && Notification.permission === 'granted') {
            if (document.hidden) {
                new Notification(title, { body, icon });
            }
        }
    };

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const selectedStudentRef = useRef(selectedChat?.studentInfo);
    useEffect(() => {
        selectedStudentRef.current = selectedChat?.studentInfo;
    }, [selectedChat]);


    // Initialize Socket once
    useEffect(() => {
        const newSocket = io(API_URL, {
            withCredentials: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected');
            newSocket.emit('join_admin');
        });

        // Student sent a message → show it in chat + update sidebar
        newSocket.on('new_inquiry', (data) => {
            fetchActiveChats();
            // Add to chat if this student's conversation is open
            if (selectedStudentRef.current?._id === data.studentId) {
                setMessages(prev => {
                    if (data.message?._id && prev.find(m => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
            }
            showBrowserNotification(
                '💬 New Student Message',
                `${data.message?.message || 'New support inquiry received'}`,
                '/favicon.ico'
            );
        });

        // Admin sent a message → only refresh sidebar (admin already sees it via optimistic update)
        newSocket.on('admin_sent', (data) => {
            fetchActiveChats();
        });

        // NOTE: 'message' event is now only sent to the student's room.
        // Admin is NOT in that room, so this handler will never fire for admin.
        // Keeping it here as a safety guard only.
        newSocket.on('message', (msg) => {
            if (selectedStudentRef.current?._id === msg.student) {
                setMessages(prev => {
                    if (msg._id && prev.find(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
        });


        return () => newSocket.close();
    }, [API_URL]);



    // Fetch Active Chats
    useEffect(() => {
        fetchActiveChats();
    }, []);

    const fetchActiveChats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/support/active-chats`);
            setActiveChats(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load active chats');
        }
    };

    // Fetch Chat History when student selected
    useEffect(() => {
        if (selectedChat?.studentInfo) {
            fetchChatHistory(selectedChat.studentInfo._id);
            markAsRead(selectedChat.studentInfo._id);
            // NOTE: Admin does NOT join the student's socket room.
            // Admin already receives all messages via 'join_admin' room.
            // Joining the student room too causes duplicate message delivery.
        }
    }, [selectedChat, socket]);


    const fetchChatHistory = async (studentId) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/support/history/${studentId}`);
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (studentId) => {
        try {
            await axios.put(`${API_URL}/api/support/read/${studentId}`);
            fetchActiveChats(); // Update unread counts in sidebar
        } catch (err) {
            console.error(err);
        }
    };

    const handleEndChat = async () => {
        if (!selectedChat || !selectedChat.studentInfo) return;

        const result = await Swal.fire({
            title: 'Mark as Solved?',
            text: "This will permanently delete the chat history for this student.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f8fafc',
            confirmButtonText: 'Yes, Solve & Delete',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'rounded-xl font-bold px-6 py-3',
                cancelButton: 'rounded-xl font-bold px-6 py-3 text-slate-600'
            }
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`${API_URL}/api/support/end-chat/${selectedChat.studentInfo._id}`);
            if (socket) {
                socket.emit('end_chat_session', selectedChat.studentInfo._id);
            }
            setSelectedChat(null);
            setMessages([]);
            fetchActiveChats();
            Swal.fire({
                title: 'Solved!',
                text: 'The query has been marked as resolved.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to end chat');
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !socket) return;

        const trimmed = newMessage.trim();
        const messageData = {
            studentId: selectedChat.studentInfo._id,
            adminId: admin._id,
            sender: 'admin',
            message: trimmed,
            category: selectedChat.category || 'general'
        };

        // Optimistically add to chat immediately (server will NOT echo back to admin)
        const optimisticMsg = {
            _id: `temp_${Date.now()}`,
            student: selectedChat.studentInfo._id,
            sender: 'admin',
            message: trimmed,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        socket.emit('sendMessage', messageData);

    };


    const filteredChats = activeChats.filter(chat => {
        const matchesSearch = chat.studentInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.studentInfo.phone?.includes(searchQuery);
        const matchesCategory = filterCategory === 'all' || chat.category === filterCategory;
        return matchesSearch && matchesCategory;
    });


    return (
        <div className="h-[calc(100vh-120px)] bg-white rounded-[8px] shadow-sm border border-slate-200 overflow-hidden flex">

            {/* Sidebar: Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-[#0f1523] flex flex-col bg-[#1B2538] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-[#0f1523] bg-[#0E1524]">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <MessageSquare className="text-indigo-400" size={24} /> Support Inbox
                    </h2>
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#0F1522] border border-[#2d3a54] rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/40 transition-all outline-none"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-[#0F1522] border border-[#2d3a54] rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-indigo-500/40 outline-none"
                        >
                            <option value="all">All Channels</option>
                            <option value="general">General</option>
                            <option value="placement">Placement</option>
                            <option value="technical">Technical</option>
                            <option value="fees">Fees/Payments</option>
                        </select>
                    </div>

                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-500" /></div>
                    ) : filteredChats.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No active chats found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#1f2e46]">
                            {filteredChats.map((chat) => (
                                <button
                                    key={chat._id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`w-full p-4 flex items-start gap-3 transition-all text-left ${selectedChat?.studentInfo?._id === chat.studentInfo._id ? 'bg-[#436BB5]/30 border-l-4 border-indigo-400' : 'border-l-4 border-transparent hover:bg-[#25324b]'}`}
                                >
                                    {/* User avatar in sidebar */}
                                    <div className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden border border-[#2d3a54]">
                                        {chat.studentInfo.profilePicture || chat.studentInfo.photo ? (
                                            <img
                                                src={(chat.studentInfo.profilePicture || chat.studentInfo.photo).startsWith('http') 
                                                    ? (chat.studentInfo.profilePicture || chat.studentInfo.photo) 
                                                    : `${API_URL}/${chat.studentInfo.profilePicture || chat.studentInfo.photo}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-lg">
                                                {chat.studentInfo.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm truncate">{chat.studentInfo.name}</h4>
                                            <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap ml-2">
                                                {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-1 truncate ${chat.unreadCount > 0 ? 'text-white font-black' : 'text-slate-400'}`}>
                                            <span className="text-[9px] font-bold uppercase tracking-tighter text-indigo-400 mr-2 border border-indigo-900 px-1 rounded">
                                                {chat.category || 'general'}
                                            </span>
                                            {chat.lastSender === 'admin' ? 'You: ' : ''}{chat.lastMessage}
                                        </p>

                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main: Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50/30 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="md:hidden p-2 text-slate-400 hover:text-slate-600"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                {/* User avatar in chat header */}
                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                    {selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo ? (
                                        <img
                                            src={(selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo).startsWith('http') 
                                                ? (selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo) 
                                                : `${API_URL}/${selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo}`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                            {selectedChat.studentInfo.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedChat.studentInfo.name}</h3>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        {selectedChat.category || 'General'} Support Thread
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEndChat}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                                >
                                    <CheckCircle2 size={16} /> Query Solved
                                </button>
                                <button className="p-2 text-slate-300 hover:text-slate-600">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Student Detail Card - Z-index Popup */}
                        {showStudentCard && (
                            <div
                                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"
                                onClick={() => setShowStudentCard(false)}
                            >
                                <div
                                    className="bg-white rounded-2xl shadow-2xl w-72 overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Profile Photo */}
                                    <div className="flex flex-col items-center pt-8 pb-4 px-6">
                                        {selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo ? (
                                            <img
                                                src={(selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo).startsWith('http') 
                                                    ? (selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo) 
                                                    : `${API_URL}/${selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo}`}
                                                alt=""
                                                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 shadow-md mb-3"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-md mb-3">
                                                {selectedChat.studentInfo.name.charAt(0)}
                                            </div>
                                        )}
                                        <h3 className="font-black text-slate-900 text-base">{selectedChat.studentInfo.name}</h3>
                                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{selectedChat.category || 'General'} Support</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-slate-100 mx-6" />

                                    {/* Details */}
                                    <div className="px-6 py-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider w-12">Phone</span>
                                            <span className="text-slate-800 text-sm font-semibold">{selectedChat.studentInfo.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider w-12 pt-0.5">Email</span>
                                            <span className="text-slate-800 text-sm font-semibold break-all">{selectedChat.studentInfo.email}</span>
                                        </div>
                                    </div>

                                    {/* Close */}
                                    <div className="px-6 pb-6">
                                        <button
                                            onClick={() => setShowStudentCard(false)}
                                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* User Avatar - clickable */}
                                    {msg.sender !== 'admin' && (
                                        <button
                                            onClick={() => setShowStudentCard(true)}
                                            className="shrink-0 mt-1 group relative"
                                            title="View user details"
                                        >
                                            {selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo ? (
                                                <img
                                                    src={(selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo).startsWith('http') 
                                                        ? (selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo) 
                                                        : `${API_URL}/${selectedChat.studentInfo.profilePicture || selectedChat.studentInfo.photo}`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-md group-hover:ring-indigo-300 transition-all"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-md group-hover:ring-indigo-300 transition-all">
                                                    {selectedChat.studentInfo.name.charAt(0)}
                                                </div>
                                            )}
                                        </button>
                                    )}

                                    <div className={`max-w-[70%] group`}>
                                        <div className={`p-4 rounded-3xl text-sm shadow-sm ${msg.sender === 'admin'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                            }`}>
                                            {msg.message}
                                        </div>
                                        <div className={`mt-1 flex items-center gap-1 px-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.sender === 'admin' && (
                                                <CheckCheck size={12} className={msg.isRead ? 'text-indigo-400' : 'text-slate-300'} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
                            <div className="flex items-center gap-3 bg-slate-50 p-2 pl-6 rounded-2xl border border-slate-200 focus-within:border-indigo-300 transition-all shadow-inner">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your response..."
                                className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Headset size={48} strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Select a Conversation</h3>
                    <p className="text-sm font-medium mt-2">Pick a conversation from the left to start helping them real-time.</p>
                </div>
                )}
            </div>
        </div>
    );
};

export default SupportInbox;
