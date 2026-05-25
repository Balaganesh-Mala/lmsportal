import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Headset, Loader2, ChevronDown } from 'lucide-react';
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
    const [unreadCount, setUnreadCount] = useState(0);

    const staff = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('adminUser');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    }, []);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const isOpenRef = useRef(isOpen);
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    const fetchUnreadCount = async () => {
        if (!staff?._id) return;
        try {
            const { data } = await axios.get(`${API_URL}/api/support/unread-count/${staff._id}`);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    const markAsRead = async () => {
        if (!staff?._id) return;
        try {
            await axios.put(`${API_URL}/api/support/read-student/${staff._id}`);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    };

    useEffect(() => {
        if (staff) {
            fetchUnreadCount();
        }
    }, [staff]);

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
        if (staff) {
            const newSocket = io(API_URL, {
                withCredentials: true
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', staff._id);
            });

            newSocket.on('message', (msg) => {
                setChatHistory(prev => [...prev, msg]);
                if (msg.sender === 'admin') {
                    showBrowserNotification(
                        '📩 Support Reply',
                        msg.message || 'Admin has replied to your query'
                    );
                    if (!isOpenRef.current) {
                        setUnreadCount(prev => prev + 1);
                    } else {
                        axios.put(`${API_URL}/api/support/read-student/${staff._id}`).catch(e => console.error(e));
                    }
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
    }, [staff, API_URL]);

    // Fetch History
    useEffect(() => {
        if (isOpen && staff) {
            markAsRead();
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/support/history/${staff._id}`);
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
            studentId: staff._id,
            sender: 'trainer',
            message: message.trim(),
            category: selectedCategory
        };

        socket.emit('sendMessage', messageData);
        setMessage('');
    };

    if (!staff) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100/90 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-slate-100">
                    {/* Header */}
                    <div className="bg-[#1B2538] p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Headset size={16} className="text-indigo-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-wider block leading-none">Support Center</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-1 leading-none">Chat with Administrator</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-xl transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Persistent Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-3 pr-8 text-[11px] font-bold text-white outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="general" className="text-slate-800">👋 General Inquiry</option>
                                <option value="technical" className="text-slate-800">💻 Portal Issues</option>
                                <option value="fees" className="text-slate-800">💰 Financial Syncs</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
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
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                    <MessageCircle className="text-slate-300 animate-pulse" size={24} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">No messages in {selectedCategory}</p>
                            </div>
                        )}

                        {chatHistory.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-end gap-2.5 ${msg.sender === 'trainer' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}
                            >
                                {/* Compact Avatar */}
                                <div className="shrink-0 mb-0.5">
                                    {msg.sender === 'trainer' ? (
                                        staff.photo ? (
                                            <img
                                                src={staff.photo.startsWith('http') ? staff.photo : `${API_URL}/${staff.photo}`}
                                                alt="You"
                                                className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black border border-white shadow-sm">
                                                {staff.name.charAt(0)}
                                            </div>
                                        )
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] border border-white shadow-sm">
                                            <Headset size={12} />
                                        </div>
                                    )}
                                </div>

                                <div className={`relative max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] shadow-sm font-semibold tracking-wide ${msg.sender === 'trainer'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                                    }`}>
                                    <div className="flex flex-wrap items-end gap-2.5">
                                        <span className="leading-tight">{msg.message}</span>
                                        <span className={`text-[9px] font-medium leading-none mb-0.5 shrink-0 ${msg.sender === 'trainer' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2.5">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-50 border-none outline-none px-4 py-2.5 rounded-full text-sm focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100 shrink-0"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* FAB - Only show when chat is closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 relative bg-indigo-600 text-white hover:bg-indigo-700 ${unreadCount > 0 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
                >
                    <MessageCircle size={24} className={unreadCount > 0 ? 'animate-[bounce_2s_infinite]' : ''} />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white border-2 border-white animate-ping"></span>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white border-2 border-white shadow-sm shadow-red-500/50">
                                {unreadCount}
                            </span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default LiveSupport;
