import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Award, CheckCircle, Trophy, Flame, Target, Crown, Coins, Settings, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FcReading } from 'react-icons/fc';
import { fireLoginBlast, fireSuccessBlast } from '../utils/confetti';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        hoursLearned: 0,
        attendance: 0,
        batchProgress: 0,
        certificates: 0
    });
    const [wallet, setWallet] = useState({ totalPoints: 0, totalCoins: 0, level: 1 });
    const [completedTasks, setCompletedTasks] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [weeklyActivity, setWeeklyActivity] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
    const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
    const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
    const [weeklyRank, setWeeklyRank] = useState(null);
    const [dailyRank, setDailyRank] = useState(null);
    const [leaderboardPeriod, setLeaderboardPeriod] = useState('all_time');
    const [loading, setLoading] = useState(true);
    const [activeOrbSlide, setActiveOrbSlide] = useState(0); // 0 = Daily, 1 = Weekly
    const [showMiniLeaderboard, setShowMiniLeaderboard] = useState(false);
    const [miniLeaderboardTab, setMiniLeaderboardTab] = useState('daily'); // 'daily' | 'weekly'
    const [activeMobileTab, setActiveMobileTab] = useState('dashboard'); // 'dashboard' | 'profile'

    // Time-range activity chart state
    const [activityRange, setActivityRange] = useState('week'); // 'week' | 'month' | 'year'
    const [activityChartData, setActivityChartData] = useState([]);
    const [activitySummary, setActivitySummary] = useState({ totalHours: 0, topicCount: 0, activeDays: 0 });
    const [activityLoading, setActivityLoading] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('studentUser');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                if (parsedUser._id) {
                    const results = await Promise.allSettled([
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/dashboard/${parsedUser._id}`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=weekly`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=daily`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=all_time`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/rewards/wallet/${parsedUser._id}`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/courses`)
                    ]);

                    const dashboardRes = results[0].status === 'fulfilled' ? results[0].value : null;
                    const weeklyRes = results[1].status === 'fulfilled' ? results[1].value : null;
                    const dailyRes = results[2].status === 'fulfilled' ? results[2].value : null;
                    const allTimeRes = results[3].status === 'fulfilled' ? results[3].value : null;
                    const walletRes = results[4].status === 'fulfilled' ? results[4].value : null;
                    const coursesRes = results[5].status === 'fulfilled' ? results[5].value : null;

                    if (dashboardRes && dashboardRes.data.success) {
                        setStats(dashboardRes.data.stats);
                        setRecentActivity(dashboardRes.data.recentActivity);
                        setWeeklyActivity(dashboardRes.data.weeklyActivity);
                    }

                    if (weeklyRes && weeklyRes.data.success) {
                        setWeeklyLeaderboard(weeklyRes.data.leaderboard);
                        const myInfo = weeklyRes.data.leaderboard.find(s => s.id === parsedUser._id);
                        if (myInfo) setWeeklyRank(myInfo);
                        if (leaderboardPeriod === 'weekly') {
                            setLeaderboard(weeklyRes.data.leaderboard);
                        }
                    }

                    if (dailyRes && dailyRes.data.success) {
                        setDailyLeaderboard(dailyRes.data.leaderboard);
                        const myInfo = dailyRes.data.leaderboard.find(s => s.id === parsedUser._id);
                        if (myInfo) setDailyRank(myInfo);
                        if (leaderboardPeriod === 'daily') {
                            setLeaderboard(dailyRes.data.leaderboard);
                        }
                    }

                    if (allTimeRes && allTimeRes.data.success) {
                        setAllTimeLeaderboard(allTimeRes.data.leaderboard);
                        if (leaderboardPeriod === 'all_time') {
                            setLeaderboard(allTimeRes.data.leaderboard);
                        }
                    }

                    if (walletRes && walletRes.data.success) {
                        setWallet({
                            totalPoints: walletRes.data.totalPoints,
                            totalCoins: walletRes.data.totalCoins,
                            level: walletRes.data.level
                        });
                    }

                    if (coursesRes && parsedUser.courseName) {
                        const course = coursesRes.data.find(c => c.title === parsedUser.courseName);
                        if (course) {
                            try {
                                const progressRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/progress/${course._id}/${parsedUser._id}`);
                                if (progressRes.data && progressRes.data.progress) {
                                    const completed = progressRes.data.progress.filter(p => p.completed).length;
                                    setCompletedTasks(completed);
                                }
                            } catch (e) {
                                console.error("Progress fetch error:", e);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error loading dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [leaderboardPeriod]);

    useEffect(() => {
        fetchDashboardData();

        const handleSync = () => {
            fetchDashboardData();
        };
        window.addEventListener('smart-aspirants-activity-sync', handleSync);

        return () => {
            window.removeEventListener('smart-aspirants-activity-sync', handleSync);
        };
    }, [fetchDashboardData]);

    useEffect(() => {
        const showBlast = localStorage.getItem('showLoginBlast');
        if (showBlast === 'true') {
            localStorage.removeItem('showLoginBlast');
            const timer = setTimeout(() => {
                fireLoginBlast();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const fetchActivity = async (range, studentId) => {
        if (!studentId) return;
        setActivityLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/activity/${studentId}?range=${range}`);
            if (res.data.success) {
                setActivityChartData(res.data.chartData);
                setActivitySummary(res.data.summary);
            }
        } catch (err) {
            console.error('Activity fetch error:', err);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('studentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser._id) {
                fetchActivity(activityRange, parsedUser._id);
            }
        }
    }, [activityRange]);

    const statCards = [
        { label: 'Enrolled Courses', value: stats.enrolledCourses, icon: (p) => <FcReading {...p} />, cardBg: 'bg-blue-50/50', iconBg: 'bg-white', trendColor: 'text-blue-600 bg-blue-100', trend: 'Active', border: 'border-blue-100' },
        { label: 'Daily Streak', value: `${stats.currentStreak || 0} Days`, icon: (p) => <Flame {...p} />, cardBg: 'bg-orange-50/50', iconBg: 'bg-orange-100/50 text-orange-500', trendColor: 'text-orange-600 bg-orange-100', trend: `Best: ${stats.highestStreak || 0}`, border: 'border-orange-100' },
        { label: 'Certificates Obtained', value: stats.certificates || 0, icon: (p) => <Award {...p} />, cardBg: 'bg-purple-50/50', iconBg: 'bg-white', trendColor: 'text-purple-600 bg-purple-100', trend: 'Achievement', border: 'border-purple-100' },
    ];

    const getUserRank = (type = 'all_time') => {
        let targetLeaderboard = allTimeLeaderboard;
        if (type === 'weekly') targetLeaderboard = weeklyLeaderboard;
        if (type === 'daily') targetLeaderboard = dailyLeaderboard;

        if (!user || !targetLeaderboard || targetLeaderboard.length === 0) return null;
        const index = targetLeaderboard.findIndex(s => s.id === user._id);
        if (index !== -1) {
            return { rank: index + 1, points: targetLeaderboard[index].points };
        }
        return null;
    };

    const userRankInfo = getUserRank(leaderboardPeriod);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen xl:h-screen flex flex-col p-4 md:p-6 overflow-y-auto xl:overflow-hidden bg-gray-50">
            <style>{`
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-none {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Mobile/Tablet Segmented Tab Switcher (Only visible below xl) */}
            <div className="xl:hidden flex p-1 bg-slate-200/50 rounded-xl border border-slate-200/70 mb-5 shrink-0 max-w-md mx-auto w-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveMobileTab('dashboard')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        activeMobileTab === 'dashboard'
                            ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-100 font-extrabold'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveMobileTab('profile')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        activeMobileTab === 'profile'
                            ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-100 font-extrabold'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`}
                >
                    Profile Details
                </button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8 h-auto xl:h-[calc(100vh-3rem)] items-start xl:items-stretch overflow-visible xl:overflow-hidden">
                
                {/* MIDDLE MAIN CONTENT (xl:col-span-3) - INDEPENDENT SCROLL */}
                <div className={`xl:col-span-3 space-y-6 min-w-0 bg-gray-100/40 p-4 md:p-6 rounded-3xl border border-gray-200/60 shadow-sm h-auto xl:h-full overflow-y-visible xl:overflow-y-auto scrollbar-none pb-12 ${
                    activeMobileTab === 'dashboard' ? 'block' : 'hidden xl:block'
                }`}>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {statCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className={`p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all cursor-default`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${stat.iconBg} shadow-sm`}>
                                            <Icon size={24} />
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.trendColor}`}>{stat.trend}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">{stat.label}</p>
                                        <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Learning Activity Chart with Time-Range Tabs */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <h2 className="text-lg font-bold text-gray-855">Learning Activity</h2>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                {[{ key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActivityRange(tab.key)}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activityRange === tab.key
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6 px-1">
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                                <Trophy size={16} className="text-orange-500" />
                                <span className="text-base font-black text-orange-700">{activitySummary.totalPoints || 0}</span>
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">points</span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                                <Flame size={16} className="text-indigo-500" />
                                <span className="text-base font-black text-indigo-700">{activitySummary.activeDays || 0}</span>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">active days</span>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 280 }} className="relative">
                            {activityLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl z-10">
                                    <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={activityChartData.length > 0 ? activityChartData : weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={1} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: activityRange === 'month' ? 10 : 12, fontWeight: 700 }}
                                        dy={10}
                                        interval={activityRange === 'month' ? 4 : 0}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        cursor={{ fill: '#fff7ed' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px', backgroundColor: '#ffffff' }}
                                        itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#f97316' }}
                                        labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Bar
                                        dataKey="points"
                                        name="Points Earned"
                                        fill="url(#colorPoints)"
                                        radius={[12, 12, 0, 0]}
                                        barSize={activityRange === 'month' ? 8 : activityRange === 'year' ? 16 : 28}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Recent Completed Topics</h2>
                        </div>

                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold shrink-0">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 text-sm">{activity.topic}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{activity.course}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(activity.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No recent activity found. Start learning!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT STUDENT PROFILE COLUMN (xl:col-span-1) - GOLDEN IVORY ARCADE */}
                <div className={`xl:col-span-1 flex flex-col h-auto xl:h-full overflow-y-auto scrollbar-none min-w-0 ${
                    activeMobileTab === 'profile' ? 'block' : 'hidden xl:block'
                }`}>
                    
                    {/* STICKY HEADER ROW: Premium Passport Badge (8px Rounded corners - Enlarge edition) */}
                    {!showMiniLeaderboard && (
                        <div className="sticky top-0 bg-gray-50 pb-4 z-10 shrink-0">
                            <motion.div 
                                whileHover={{ y: -2 }}
                                className="bg-white border border-slate-200/90 rounded-[8px] p-6 shadow-[0_16px_32px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col items-center text-center"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                                
                                {/* Action Buttons Deck (Settings & Sign Out) */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                                    <button 
                                        onClick={() => navigate('/settings')}
                                        className="p-1 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-450 hover:text-slate-650 transition-all shadow-sm"
                                        title="Settings"
                                    >
                                        <Settings size={12} className="stroke-[2.5]" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            localStorage.removeItem('studentUser');
                                            navigate('/login');
                                        }}
                                        className="p-1 rounded-[6px] border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-500 hover:text-red-650 transition-all shadow-sm"
                                        title="Sign Out"
                                    >
                                        <LogOut size={12} className="stroke-[2.5]" />
                                    </button>
                                </div>

                                {/* Centered Profile Avatar with Premium Golden Frame */}
                                <div className="relative shrink-0 mb-3 mt-1 group">
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white p-[2.5px] border-2 border-amber-400 shadow-md ring-4 ring-amber-100/50">
                                        {user?.profilePicture ? (
                                            <img
                                                src={user.profilePicture}
                                                alt={user?.name}
                                                className="w-full h-full object-cover rounded-full"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-amber-700 font-black text-2xl bg-amber-50 rounded-full">
                                                {user?.name?.charAt(0) || 'B'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                        <Trophy size={11} className="fill-white" />
                                    </div>
                                </div>
                                
                                {/* Centered Name and Rank Details (Immune to squishing/overflow) */}
                                <div className="flex flex-col items-center w-full min-w-0">
                                    <h3 className="font-black text-slate-800 text-lg md:text-xl leading-tight truncate tracking-tight w-full px-2">
                                        {user?.name || 'Balaganesh Mala'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                             setShowMiniLeaderboard(true);
                                             fireSuccessBlast();
                                         }}
                                        className="flex items-center gap-1.5 text-xs font-black text-indigo-650 hover:text-indigo-850 transition-colors mt-2.5 bg-indigo-50/80 px-3.5 py-1.5 rounded-[8px] border border-indigo-100 shadow-sm"
                                    >
                                        <Trophy size={12} className="text-indigo-500 fill-indigo-500/10 animate-pulse" />
                                        <span>Rank {dailyRank?.rank ? `#${dailyRank.rank}` : '--'}</span>
                                        <span className="text-[10px] font-bold text-indigo-400">&gt;</span>
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2.5 leading-none">
                                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* CONSOLE PANELS */}
                    <div className="flex-grow space-y-6 pb-12 pr-1">
                        
                        {showMiniLeaderboard ? (
                            /* MINI LEADERBOARD CONSOLE PANEL (Inline replacement) */
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200/90 rounded-[8px] p-5 shadow-[0_16px_32px_rgba(0,0,0,0.02)] space-y-4"
                            >
                                {/* Back Link */}
                                <button
                                    onClick={() => setShowMiniLeaderboard(false)}
                                    className="flex items-center gap-1 text-[11px] font-black text-slate-450 hover:text-slate-650 transition-colors uppercase tracking-wider"
                                >
                                    <span className="text-sm font-black">&lt;</span> Back
                                </button>

                                {/* Header Title Row */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#ecfeff] flex items-center justify-center text-[#06b6d4]">
                                        <Trophy size={18} className="fill-[#06b6d4]/10" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Leaderboard</h3>
                                </div>

                                {/* Tabs Segment */}
                                <div className="bg-slate-100 p-1 rounded-[8px] flex items-center">
                                    <button
                                        onClick={() => setMiniLeaderboardTab('daily')}
                                        className={`flex-1 py-1.5 text-center text-xs font-black rounded-[6px] transition-all ${
                                            miniLeaderboardTab === 'daily' 
                                                ? 'bg-white text-slate-800 shadow-sm' 
                                                : 'text-slate-400 hover:text-slate-650'
                                        }`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setMiniLeaderboardTab('weekly')}
                                        className={`flex-1 py-1.5 text-center text-xs font-black rounded-[6px] transition-all ${
                                            miniLeaderboardTab === 'weekly' 
                                                ? 'bg-white text-slate-800 shadow-sm' 
                                                : 'text-slate-400 hover:text-slate-650'
                                        }`}
                                    >
                                        Weekly
                                    </button>
                                </div>

                                {/* Subheader Date Banner */}
                                <div className="bg-indigo-50/60 text-slate-700 py-2.5 px-4 rounded-[8px] flex justify-between items-center text-xs font-black border border-indigo-50">
                                    <span>{miniLeaderboardTab === 'daily' ? "Today's Leaderboard" : "Weekly Leaderboard"}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>

                                {/* Leaderboard List */}
                                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-0.5 scrollbar-none">
                                    {(miniLeaderboardTab === 'daily' ? dailyLeaderboard : weeklyLeaderboard).map((entry, idx) => {
                                        const isMe = entry.id === user?._id;
                                        return (
                                            <div 
                                                key={entry.id || idx}
                                                className={`flex items-center justify-between p-3 rounded-[8px] transition-all ${
                                                    isMe 
                                                        ? 'bg-[#d2f8ff] border-l-4 border-[#06b6d4] shadow-sm' 
                                                        : 'bg-white border border-slate-100 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Rank Number */}
                                                    <span className={`text-xs font-black w-6 text-center ${
                                                        isMe ? 'text-[#06b6d4]' : 'text-slate-400'
                                                    }`}>
                                                        {entry.rank || '--'}
                                                    </span>
                                                    {/* Avatar */}
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                        {entry.profilePicture ? (
                                                            <img 
                                                                src={entry.profilePicture} 
                                                                alt={entry.name}
                                                                className="w-full h-full object-cover"
                                                                crossOrigin="anonymous"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-550 bg-slate-200">
                                                                {entry.name?.charAt(0) || 'S'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Name */}
                                                    <span className={`text-xs font-bold truncate ${
                                                        isMe ? 'text-slate-900 font-extrabold' : 'text-slate-700 font-medium'
                                                    }`}>
                                                        {entry.name || 'Student'}
                                                    </span>
                                                </div>

                                                {/* Points Star Badge */}
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 shrink-0">
                                                    <Award size={11} className="text-indigo-650 fill-indigo-200" />
                                                    <span className="text-[11px] font-black text-indigo-750">
                                                        {entry.points || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Achievements Deck (Royal Archive - Compact 8px Rounded corners) */}
                                <motion.div 
                                    whileHover={{ y: -1 }}
                                    className="bg-white border border-slate-200/80 rounded-[8px] p-4 shadow-[0_6px_16px_rgba(0,0,0,0.01)] relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                        <h4 className="font-black text-slate-800 text-[10px] tracking-wider uppercase">Royal Archive</h4>
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[8px] border border-emerald-100/50">⚡ Active</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {/* Streak Badge */}
                                        <div className="flex flex-col items-center justify-center bg-orange-50/40 border border-orange-100/30 rounded-[8px] py-2 px-1">
                                            <span className="text-sm font-black text-slate-850 leading-tight">
                                                {stats.currentStreak || 0}
                                            </span>
                                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none mt-1">
                                                Streaks
                                            </span>
                                        </div>
                                        
                                        {/* Points Badge */}
                                        <div className="flex flex-col items-center justify-center bg-indigo-50/40 border border-indigo-100/30 rounded-[8px] py-2 px-1">
                                            <span className="text-sm font-black text-slate-850 leading-tight">
                                                {wallet.totalPoints || 0}
                                            </span>
                                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
                                                Points
                                            </span>
                                        </div>
                                        
                                        {/* Coins Badge */}
                                        <div className="flex flex-col items-center justify-center bg-amber-50/40 border border-amber-100/30 rounded-[8px] py-2 px-1">
                                            <span className="text-sm font-black text-slate-850 leading-tight">
                                                {wallet.totalCoins || 0}
                                            </span>
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mt-1">
                                                Coins
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Active Orbs Carousel with Weekly Tracker (Compact 8px Rounded corners) */}
                                {(() => {
                                    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                    const now = new Date();
                                    const currentDayIdx = now.getDay(); // 0 is Sunday, 1 is Monday...

                                    // Build weekly challenge completed days (if student achieved at least 100 XP on that day)
                                    // Using standard weeklyActivity array
                                    const weeklyDays = daysOfWeek.map((day, idx) => {
                                        // weeklyActivity starts with Monday (idx 0), but our day array starts with Sunday (idx 0)
                                        // Let's map it safely
                                        const activityDaysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                        const dayName = activityDaysMap[idx];
                                        const activityForDay = weeklyActivity.find(a => a.name === dayName);
                                        const completed = activityForDay ? (activityForDay.points >= 100) : false;

                                        return {
                                            day,
                                            completed
                                        };
                                    });

                                    const completedCount = weeklyDays.filter(d => d.completed).length;
                                    const weeklyGoalAchieved = completedCount >= 5;

                                    return (
                                        <motion.div 
                                            whileHover={{ y: -2 }}
                                            className="bg-white border border-slate-200/85 rounded-[8px] p-5 shadow-[0_12px_24px_rgba(0,0,0,0.015)] relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                            
                                            {/* Header Controls */}
                                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Active Orbs</span>
                                                </div>
                                                
                                                {/* Carousel Tabs */}
                                                <div className="flex bg-slate-100 p-0.5 rounded-[6px]">
                                                    <button 
                                                        onClick={() => setActiveOrbSlide(0)}
                                                        className={`px-2.5 py-1 text-[9px] font-black rounded-[4px] transition-all ${activeOrbSlide === 0 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
                                                    >
                                                        Daily
                                                    </button>
                                                    <button 
                                                        onClick={() => setActiveOrbSlide(1)}
                                                        className={`px-2.5 py-1 text-[9px] font-black rounded-[4px] transition-all ${activeOrbSlide === 1 ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-650'}`}
                                                    >
                                                        Weekly
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Slide Content */}
                                            <div className="relative min-h-[105px]">
                                                {activeOrbSlide === 0 ? (
                                                    /* Daily Focus Slide */
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-5"
                                                    >
                                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle
                                                                    cx="32"
                                                                    cy="32"
                                                                    r="27"
                                                                    stroke="#e2e8f0"
                                                                    strokeWidth="4"
                                                                    fill="transparent"
                                                                />
                                                                <circle
                                                                    cx="32"
                                                                    cy="32"
                                                                    r="27"
                                                                    stroke="url(#uxDailyIndigo)"
                                                                    strokeWidth="4"
                                                                    fill="transparent"
                                                                    strokeDasharray={2 * Math.PI * 27}
                                                                    strokeDashoffset={2 * Math.PI * 27 * (1 - Math.min((stats.dailyPoints || 0) / 100, 1))}
                                                                    strokeLinecap="round"
                                                                    className="transition-all duration-700 ease-out"
                                                                />
                                                            </svg>
                                                            <div className="absolute flex flex-col items-center justify-center">
                                                                <span className="text-[10px] font-black text-slate-800">{stats.dailyPoints || 0}/100</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800">Daily Focus Goal</span>
                                                            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-bold">
                                                                Earn 100 XP today to complete your daily challenge and secure pool rewards!
                                                            </p>
                                                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-2">Goal XP Indicator</span>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    /* Weekly Focus Slide with Tracker Grid */
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex flex-col gap-4"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                                                <svg className="w-full h-full transform -rotate-90">
                                                                    <circle
                                                                        cx="32"
                                                                        cy="32"
                                                                        r="27"
                                                                        stroke="#d1fae5"
                                                                        strokeWidth="4"
                                                                        fill="transparent"
                                                                    />
                                                                    <circle
                                                                        cx="32"
                                                                        cy="32"
                                                                        r="27"
                                                                        stroke="url(#uxWeeklyEmerald)"
                                                                        strokeWidth="4"
                                                                        fill="transparent"
                                                                        strokeDasharray={2 * Math.PI * 27}
                                                                        strokeDashoffset={2 * Math.PI * 27 * (1 - Math.min((weeklyRank?.points || 0) / 500, 1))}
                                                                        strokeLinecap="round"
                                                                        className="transition-all duration-700 ease-out"
                                                                    />
                                                                </svg>
                                                                <div className="absolute flex flex-col items-center justify-center">
                                                                    <span className="text-[10px] font-black text-slate-800">{weeklyRank?.points || 0}/500</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-800">Weekly Focus Goal</span>
                                                                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-bold">
                                                                    Reach 500 XP and sustain at least 5 completed daily challenges this week!
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Calendar Grid (S, M, T, W, T, F, S) */}
                                                        <div className="flex flex-col gap-2 bg-slate-50/50 border border-slate-100 p-2.5 rounded-[8px]">
                                                            <div className="flex justify-between items-center px-1">
                                                                {weeklyDays.map((d, idx) => (
                                                                    <div key={idx} className="flex flex-col items-center gap-1">
                                                                         <span className="text-[8px] font-black text-slate-400 uppercase">{d.day}</span>
                                                                         {d.completed ? (
                                                                             <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/10">
                                                                                 <CheckCircle size={10} className="stroke-[3]" />
                                                                             </div>
                                                                         ) : (
                                                                             <div className="w-5 h-5 rounded-full border border-dashed border-slate-200 bg-white flex items-center justify-center text-slate-350">
                                                                                 <span className="text-[8px] font-bold">•</span>
                                                                             </div>
                                                                         )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {weeklyGoalAchieved ? (
                                                                <div className="bg-emerald-50 border border-emerald-100/50 text-center py-1 rounded-[4px] flex items-center justify-center gap-1">
                                                                    <span className="text-[9px] font-black text-emerald-700">🎉 Weekly Goal Achieved!</span>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-slate-100 border border-slate-200/50 text-center py-1 rounded-[4px] flex items-center justify-center gap-1">
                                                                    <span className="text-[9px] font-black text-slate-500">🎯 Challenge: {completedCount}/5 Days Completed</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            
                                            {/* Gradients Defs */}
                                            <svg className="absolute w-0 h-0">
                                                <defs>
                                                    <linearGradient id="uxDailyIndigo" x1="0" y1="0" x2="1" y2="1">
                                                        <stop offset="0%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#4f46e5" />
                                                    </linearGradient>
                                                    <linearGradient id="uxWeeklyEmerald" x1="0" y1="0" x2="1" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#059669" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            
                                            {/* Bottom Reward Panel */}
                                            <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold">
                                                <span>Total Pool Reward:</span>
                                                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-[8px] border border-amber-500/20">
                                                    <Coins size={12} className="text-amber-600 fill-amber-500/10 animate-bounce" />
                                                    <span className="text-xs font-black text-amber-700">250 Coins</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })()}

                                {/* Active Streak Track Card */}
                                <motion.div 
                                    whileHover={{ y: -2 }}
                                    className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-black text-slate-800 text-sm tracking-tight">Active Streak Track</h4>
                                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">🔥 Best: {stats.highestStreak || 0}</span>
                                    </div>
                                    
                                    <div className="relative py-2">
                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 mb-2">
                                            <span>Day 0</span>
                                            <span className="text-amber-600 flex items-center gap-1">⚡ {stats.currentStreak || 0} Streak</span>
                                            <span>Day 30</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full relative p-[2px] border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full transition-all duration-700 shadow-md relative overflow-hidden"
                                                style={{ width: `${Math.min(((stats.currentStreak || 0) / 30) * 100, 100)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
