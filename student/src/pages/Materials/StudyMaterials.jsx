import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Video, Link as LinkIcon, Lock,
    ChevronRight, Search, Filter, Shield,
    ArrowLeft, MonitorPlay, Clock, Calendar, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProtectedViewer from '../../components/ProtectedViewer';
import toast from 'react-hot-toast';

const StudyMaterials = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);

    // --- Subscription Tier Logic ---
    const TIER_LEVELS = {
        'Platinum': 4,
        'Full': 4,
        'Gold': 3,
        'Intermediate': 3,
        'Premium': 2,
        'Basic': 1
    };

    const hasTierAccess = (requiredTier) => {
        if (!user?.isSubscribed) return false;
        const studentTier = (user.planTier || '').charAt(0).toUpperCase() + (user.planTier || '').slice(1).toLowerCase();
        const reqTier = (requiredTier || 'Basic').charAt(0).toUpperCase() + (requiredTier || 'Basic').slice(1).toLowerCase();
        
        const studentLevel = TIER_LEVELS[studentTier] || 0;
        const requiredLevel = TIER_LEVELS[reqTier] || 1;
        return studentLevel >= requiredLevel;
    };
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchMaterials(parsedUser._id);
        }
    }, []);

    const fetchMaterials = async (studentId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const studentToken = localStorage.getItem('studentToken');
            const config = { headers: { Authorization: `Bearer ${studentToken}` } };
            const res = await axios.get(`${API_URL}/api/study-materials/student/${studentId}`, config);
            setMaterials(res.data.data || []);
        } catch (error) {
            console.error("Error fetching materials:", error);
            toast.error("Failed to load study materials");
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = filterType === 'all' || m.contentType === filterType;
        return matchesSearch && matchesTab;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                        <Shield size={28} className="animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-slate-800 font-black uppercase tracking-[0.2em] animate-pulse">Finwise Library</p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-2">Initializing Secure Session...</p>
                </div>
            </div>
        );
    }

    if (selectedMaterial) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                /* Full Screen Theater Mode: Absolute focus */
                className="fixed inset-0 z-[999] w-screen h-screen flex flex-col bg-slate-50 overflow-hidden"
            >
                {/* Premium Glassmorphic Viewer Header */}
                <div className="w-full h-auto min-h-[4rem] py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 z-[100]">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <button
                            onClick={() => setSelectedMaterial(null)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <h2 className="text-xs md:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">{selectedMaterial.title}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="flex h-1 w-1 rounded-full bg-emerald-500"></span>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Secured Instance · Finwise Shield</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-full">
                            <Shield size={10} className="text-indigo-600" />
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Secure</span>
                        </div>
                        {selectedMaterial.isProtected && (
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-full text-white">
                                <Lock size={10} className="text-amber-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Protected</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secure Viewer Content - Full bleed */}
                <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                    <ProtectedViewer
                        type={selectedMaterial.contentType === 'file' ? 'document' : selectedMaterial.contentType}
                        url={selectedMaterial.fileUrl || selectedMaterial.linkUrl || selectedMaterial.videoUrl}
                        title={selectedMaterial.title}
                        studentInfo={user}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen pb-20">


            {/* Controls Section: Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    {['all', 'video', 'document', 'link'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterType === type
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            {type === 'all' ? 'All Resources' : type + 's'}
                        </button>
                    ))}
                </div>

                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search your library..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Materials Grid */}
            <AnimatePresence mode="wait">
                {filteredMaterials.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredMaterials.map((item) => {
                            const isLocked = !hasTierAccess(item.requiredTier);
                            return (
                                <motion.div
                                    key={item._id}
                                    layout
                                    onClick={() => {
                                        if (isLocked) {
                                            toast.error(`Subscribe to unlock this resource`, { icon: '🔒' });
                                            navigate('/subscription');
                                            return;
                                        }
                                        setSelectedMaterial(item);
                                    }}
                                    className={`group relative bg-white border border-slate-100 rounded-[10px] overflow-hidden transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer flex flex-col h-full ${isLocked ? 'grayscale-[0.5] opacity-90' : ''}`}
                                >
                                {/* Thumbnail */}
                                <div className="h-40 bg-slate-50 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            {item.contentType === 'video' ? <Video size={48} strokeWidth={1} /> :
                                                item.contentType === 'link' ? <LinkIcon size={48} strokeWidth={1} /> :
                                                    <FileText size={48} strokeWidth={1} />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] flex flex-col items-center justify-center p-4">
                                            <div className="bg-white/90 p-3 rounded-2xl shadow-xl mb-3">
                                                <Lock size={24} className="text-slate-900" />
                                            </div>
                                            <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Subscribe to unlock</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Type Badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${item.contentType === 'video' ? 'bg-rose-50 text-rose-500' :
                                            item.contentType === 'link' ? 'bg-blue-50 text-blue-500' :
                                                'bg-emerald-50 text-emerald-500'
                                            }`}>
                                            {item.contentType === 'video' ? <Video size={20} /> :
                                                item.contentType === 'link' ? <LinkIcon size={20} /> :
                                                    <FileText size={20} />}
                                        </div>
                                        {item.isProtected && (
                                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-100">
                                                <Shield size={10} /> Protected
                                            </div>
                                        )}
                                        {isLocked && (
                                            <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-slate-900/20">
                                                <Shield size={10} className="text-amber-400" /> {item.requiredTier}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{item.title}</h3>
                                        <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                                            {item.description || 'Premium resource provided for your course advancement.'}
                                        </p>
                                    </div>

                                    {/* Footer Metadata */}
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                        {item.targetType === 'individual' && (
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                                Personal
                                            </span>
                                        )}
                                    </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100"
                    >
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No materials found</h3>
                        <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search query.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BookOpenIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default StudyMaterials;
