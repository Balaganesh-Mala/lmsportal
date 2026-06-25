import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Coins, 
    Trophy, 
    Search, 
    Unlock, 
    Lock as LockIcon,
    CheckCircle2, 
    X, 
    AlertCircle,
    ShoppingBag,
    Sparkles,
    ArrowRight,
    Filter,
    Info,
    Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RewardStore = () => {
    const [courses, setCourses] = useState([]);
    const [wallet, setWallet] = useState({ totalCoins: 0, totalPoints: 0, level: 1 });
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStoreInfo, setShowStoreInfo] = useState(false);
    const navigate = useNavigate();

    const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
    const studentId = studentUser._id;

    useEffect(() => {
        if (studentId) {
            fetchData();
        }
    }, [studentId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const [storeRes, walletRes] = await Promise.all([
                axios.get(`${API_URL}/api/rewards/store?studentId=${studentId}`),
                axios.get(`${API_URL}/api/rewards/wallet/${studentId}`)
            ]);
            
            setCourses(storeRes.data);
            setWallet(walletRes.data);
        } catch (err) {
            console.error("Error fetching Reward Store data:", err);
            toast.error("Failed to load store data");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (course) => {
        if (!studentId) return;
        
        setPurchasing(course._id);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/rewards/purchase`, {
                studentId,
                courseId: course._id
            });

            if (res.data.success) {
                toast.success(res.data.message);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
                setSelectedCourse(null);
                await fetchData(); 
            }
        } catch (err) {
            console.error("Purchase error:", err);
            toast.error(err.response?.data?.message || "Purchase failed");
        } finally {
            setPurchasing(null);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-medium">Loading Store...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Confetti */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
                        {[...Array(40)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: "50vw", y: "110vh", opacity: 1 }}
                                animate={{ 
                                    x: `${Math.random() * 100}vw`, 
                                    y: "-10vh", 
                                    rotate: Math.random() * 360,
                                    opacity: 0,
                                }}
                                transition={{ duration: 2 + Math.random() * 2 }}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: ['#6366f1', '#f59e0b', '#10b981'][i % 3] }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        Reward Store
                        {/* Blinking Info Icon */}
                        <button 
                            onClick={() => setShowStoreInfo(true)}
                            className="relative flex items-center justify-center ml-1 p-1 hover:bg-slate-100 rounded-full transition-colors group"
                        >
                            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-indigo-400 opacity-75"></span>
                            <Info size={18} className="text-indigo-600 relative z-10" />
                        </button>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Unlock premium bonus courses with your rewards.</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200/50">
                        <Coins size={16} className="text-amber-500" />
                        <span className="text-sm font-bold text-slate-700">{wallet.totalCoins}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Coins</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200/50">
                        <Star size={16} className="text-indigo-500" fill="currentColor" />
                        <span className="text-sm font-bold text-slate-700">{wallet.totalPoints}</span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider ml-1">Points</span>
                    </div>
                </div>
            </div>

            {/* Store Info Modal */}
            <AnimatePresence>
                {showStoreInfo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowStoreInfo(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                        >
                            {/* Simple Header */}
                            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-indigo-50/30">
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                                        <Trophy size={14} className="text-amber-500" /> Smart Aspirants Rewards Guide
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900">How to Earn & Spend?</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Unlock exclusive perks by participating in daily activities.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowStoreInfo(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Points Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <Star size={20} fill="currentColor" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Points (Evaluation)</h4>
                                            <p className="text-xs text-slate-500">Earned via Attendance (50 Pts), Mock interviews, and Courses.</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                        <span className="font-bold text-indigo-600 underline">Use Case:</span> Points are used for **Leveling Up** and your **Leaderboard Rank**. They cannot be spent.
                                    </p>
                                </div>

                                {/* Coins Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                            <Coins size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Vault Coins (Currency)</h4>
                                            <p className="text-xs text-slate-500">Earned via QR Scan (+10 Coins) and High Performance.</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                        <span className="font-bold text-amber-600 underline">Use Case:</span> Coins are your **Spending Power**. Use them here in the Store to unlock **Bonus Courses**.
                                    </p>
                                </div>

                                {/* Sync Info */}
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Real-time Wallet Sync Active
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Content Control */}
            <div className="flex items-center gap-4 mb-10">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium"
                    />
                </div>
                <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
                    <Filter size={18} />
                </button>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div 
                        key={course._id}
                        className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col"
                    >
                        {/* Thumbnail */}
                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                            <img 
                                src={course.imageUrl || 'https://via.placeholder.com/400x225?text=Course'} 
                                alt={course.title} 
                                className={`w-full h-full object-cover transition-transform duration-500 ${course.isUnlocked ? 'group-hover:scale-105' : 'grayscale opacity-60'}`}
                            />
                            
                            {/* Lock Overlay */}
                            {!course.isUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                                        <LockIcon size={18} className="text-slate-400" />
                                    </div>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="absolute top-3 left-3">
                                {course.isUnlocked ? (
                                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                        <CheckCircle2 size={12} /> Owned
                                    </span>
                                ) : (
                                    <span className="bg-white text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-sm flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-amber-500" /> Reward
                                    </span>
                                )}
                            </div>

                            {/* Price (If locked) */}
                            {!course.isUnlocked && (
                                <div className="absolute bottom-3 right-3 flex gap-1.5">
                                    {(course.pricingType === 'coins_only' || course.pricingType === 'coins_and_points') && (
                                        <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1 shadow-sm text-slate-700">
                                            <Coins size={10} className="text-amber-500" /> {course.priceCoins}
                                        </span>
                                    )}
                                    {(course.pricingType === 'points_only' || course.pricingType === 'coins_and_points') && (
                                        <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1 shadow-sm text-slate-700">
                                            <Trophy size={10} className="text-indigo-500" /> {course.pricePoints}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Card Info */}
                        <div className="p-5 flex flex-col flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{course.skillLevel}</span>
                            <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight line-clamp-2 min-h-10 group-hover:text-indigo-600 transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium">
                                {course.description}
                            </p>

                            <div className="mt-auto">
                                {course.isUnlocked ? (
                                    <button 
                                        onClick={() => navigate(`/course/${course._id}`)}
                                        className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        Go to Class <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedCourse(course)}
                                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                                        disabled={purchasing === course._id}
                                    >
                                        {purchasing === course._id ? 'Unlocking...' : 'Unlock Now'} <Unlock size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Simple Purchase */}
            <AnimatePresence>
                {selectedCourse && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-slate-100 overflow-hidden relative"
                        >
                            <button 
                                onClick={() => setSelectedCourse(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                                    <ShoppingBag size={24} className="text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Unlock Course?</h2>
                                <p className="text-slate-500 text-xs mt-1 font-medium px-6">Access will be added to your account instantly.</p>
                            </div>

                            <div className="space-y-2 mb-8">
                                {(selectedCourse.pricingType === 'coins_only' || selectedCourse.pricingType === 'coins_and_points') && (
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                                            <Coins size={14} className="text-amber-500" /> Coins
                                        </div>
                                        <span className="text-slate-900 font-bold">{selectedCourse.priceCoins}</span>
                                    </div>
                                )}
                                {(selectedCourse.pricingType === 'points_only' || selectedCourse.pricingType === 'coins_and_points') && (
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                                            <Trophy size={14} className="text-indigo-500" /> Points
                                        </div>
                                        <span className="text-slate-900 font-bold">{selectedCourse.pricePoints}</span>
                                    </div>
                                )}
                            </div>

                            {/* Balance Check */}
                            {((selectedCourse.pricingType === 'coins_only' && wallet.totalCoins < selectedCourse.priceCoins) ||
                              (selectedCourse.pricingType === 'points_only' && wallet.totalPoints < selectedCourse.pricePoints) ||
                              (selectedCourse.pricingType === 'coins_and_points' && (wallet.totalCoins < selectedCourse.priceCoins || wallet.totalPoints < selectedCourse.pricePoints))) && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 mb-8">
                                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-rose-600 text-xs font-bold">Insufficient balance. Complete more mock interviews!</p>
                                </div>
                            )}

                            <button 
                                onClick={() => handlePurchase(selectedCourse)}
                                disabled={
                                    (selectedCourse.pricingType === 'coins_only' && wallet.totalCoins < selectedCourse.priceCoins) ||
                                    (selectedCourse.pricingType === 'points_only' && wallet.totalPoints < selectedCourse.pricePoints) ||
                                    (selectedCourse.pricingType === 'coins_and_points' && (wallet.totalCoins < selectedCourse.priceCoins || wallet.totalPoints < selectedCourse.pricePoints))
                                }
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
                            >
                                Confirm Purchase
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RewardStore;
