import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Headset, Loader2, ChevronDown } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Swal from 'sweetalert2';

const LiveSupport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('general');
    const messagesEndRef = useRef(null);


    const student = React.useMemo(() => JSON.parse(localStorage.getItem('studentUser')), []);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const showBrowserNotification = (title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            if (document.hidden || !document.hasFocus()) {
                new Notification(title, { body, icon: '/favicon.ico' });
            }
        }
    };


    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen]);

    // Initialize Socket
    useEffect(() => {
        if (student) {
            const newSocket = io(API_URL, {
                withCredentials: true
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', student._id);
            });

            newSocket.on('message', (msg) => {
                setChatHistory(prev => [...prev, msg]);
                if (msg.sender === 'admin') {
                    showBrowserNotification(
                        '📩 Support Reply',
                        msg.message || 'Admin has replied to your query'
                    );
                }
            });


            newSocket.on('chat_ended_by_admin', () => {
                setChatHistory([]);
                setSelectedCategory('general');
                Swal.fire({
                    title: 'Query Solved',
                    text: 'Your query has been marked as resolved by the admin.',
                    icon: 'success',
                    confirmButtonColor: '#4f46e5',
                    confirmButtonText: 'Great!'
                });
            });

            return () => newSocket.close();
        }
    }, [student, API_URL]);


    // Fetch History
    useEffect(() => {
        if (isOpen && student) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/support/history/${student._id}`);
            setChatHistory(data);
        } catch (err) {
            console.error('Failed to load chat history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        const messageData = {
            studentId: student._id,
            sender: 'student',
            message: message.trim(),
            category: selectedCategory
        };

        socket.emit('sendMessage', messageData);
        setMessage('');
    };

    if (!student) return null;

    return (
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[8px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-[#1B2538] p-3 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Headset size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Support</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Persistent Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-1.5 pl-3 pr-8 text-[11px] font-bold text-white outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="general" className="text-slate-800">👋 General Support</option>
                                <option value="placement" className="text-slate-800">💼 Placement Assistance</option>
                                <option value="technical" className="text-slate-800">💻 Technical Issues</option>
                                <option value="fees" className="text-slate-800">💰 Fees & Payments</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={14} />
                        </div>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {loading && (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                            </div>
                        )}

                        {!loading && chatHistory.length === 0 && (
                            <div className="text-center py-20 px-6">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3">
                                    <MessageCircle className="text-slate-300" size={24} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No messages in {selectedCategory}</p>
                            </div>
                        )}


                        {chatHistory.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-end gap-2 ${msg.sender === 'student' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}
                            >
                                {/* Compact Avatar */}
                                <div className="shrink-0 mb-0.5">
                                    {msg.sender === 'student' ? (
                                        student.profilePicture ? (
                                            <img
                                                src={student.profilePicture.startsWith('http') ? student.profilePicture : `${API_URL}/${student.profilePicture}`}
                                                alt="You"
                                                className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] font-black border border-white">
                                                {student.name.charAt(0)}
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] border border-white shadow-sm">
                                            <Headset size={10} />
                                        </div>
                                    )}
                                </div>

                                <div className={`relative max-w-[80%] px-3 py-1.5 rounded-xl text-[13px] shadow-sm ${msg.sender === 'student'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                                    }`}>
                                    <div className="flex flex-wrap items-end gap-2">
                                        <span className="leading-tight">{msg.message}</span>
                                        <span className={`text-[9px] font-medium leading-none mb-0.5 shrink-0 ${msg.sender === 'student' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}



                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-50 border-none outline-none px-4 py-2 rounded-full text-sm focus:ring-1 focus:ring-indigo-100 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </form>

                </div>
            )}

            {/* FAB - Only show when chat is closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 relative bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    <MessageCircle size={24} />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            )}

        </div>
    );
};

export default LiveSupport;
