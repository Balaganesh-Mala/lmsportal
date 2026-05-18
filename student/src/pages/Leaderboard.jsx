import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, ArrowUp } from 'lucide-react';
import axios from 'axios';

// Assets (imported to avoid bundler compile errors)
import rank1Frame from '../assets/frame_Rank_1.png';
import rank2Frame from '../assets/frame_Rank_2.png';
import rank3Frame from '../assets/frame_Rank_3.png';
import leaderboardBg from '../assets/leaderboard-bg.png';
import rank1Badge from '../assets/ui-game-icon-rank-1.jpg';
import rank2Badge from '../assets/ui-game-icon-rank-2.jpg';
import rank3Badge from '../assets/ui-game-icon-rank-3.jpg';

const Leaderboard = () => {
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
    const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
    const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
    const [leaderboardPeriod, setLeaderboardPeriod] = useState('all_time');
    const [loading, setLoading] = useState(true);

    const fetchLeaderboardData = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('studentUser');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                if (parsedUser._id) {
                    const results = await Promise.allSettled([
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=weekly`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=daily`),
                        axios.get(`${import.meta.env.VITE_API_URL}/api/students/leaderboard?studentId=${parsedUser._id}&period=all_time`)
                    ]);

                    const weeklyRes = results[0].status === 'fulfilled' ? results[0].value : null;
                    const dailyRes = results[1].status === 'fulfilled' ? results[1].value : null;
                    const allTimeRes = results[2].status === 'fulfilled' ? results[2].value : null;

                    if (weeklyRes && weeklyRes.data.success) {
                        setWeeklyLeaderboard(weeklyRes.data.leaderboard);
                        if (leaderboardPeriod === 'weekly') setLeaderboard(weeklyRes.data.leaderboard);
                    }
                    if (dailyRes && dailyRes.data.success) {
                        setDailyLeaderboard(dailyRes.data.leaderboard);
                        if (leaderboardPeriod === 'daily') setLeaderboard(dailyRes.data.leaderboard);
                    }
                    if (allTimeRes && allTimeRes.data.success) {
                        setAllTimeLeaderboard(allTimeRes.data.leaderboard);
                        if (leaderboardPeriod === 'all_time') setLeaderboard(allTimeRes.data.leaderboard);
                    }
                }
            }
        } catch (err) {
            console.error("Error loading leaderboard:", err);
        } finally {
            setLoading(false);
        }
    }, [leaderboardPeriod]);

    useEffect(() => {
        fetchLeaderboardData();
    }, [fetchLeaderboardData]);

    const userRankInfo = leaderboard.find(s => user && s.id === user._id);
    const isUserInTopTen = leaderboard.slice(0, 10).some(s => user && s.id === user._id);

    // Period Change Handler
    const handlePeriodChange = (period, data) => {
        setLeaderboardPeriod(period);
        setLeaderboard(data);
    };

    // Helper to calculate XP needed to overtake the next rank
    const getXpToNextRank = () => {
        if (!userRankInfo || !leaderboard.length) return null;
        const currentRankIndex = leaderboard.findIndex(s => s.id === user._id);
        if (currentRankIndex <= 0) return null;
        const nextRankStudent = leaderboard[currentRankIndex - 1];
        const xpDiff = nextRankStudent.points - userRankInfo.points;
        return {
            diff: xpDiff,
            name: nextRankStudent.name
        };
    };

    const xpToNext = getXpToNextRank();

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 font-outfit text-slate-800 pt-8 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                {/* 🏆 LEADERBOARD PANEL (Matching Dashboard Mini-Leaderboard Style) */}
                <div className="bg-white border border-slate-200/90 rounded-[8px] p-5 shadow-[0_16px_32px_rgba(0,0,0,0.02)] flex flex-col space-y-4">
                    
                    {/* Subheader Date & Period Switcher Banner */}
                    <div className="bg-indigo-50/60 text-slate-700 py-3 px-4 rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-black border border-indigo-50">
                        <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-[#06b6d4] shrink-0" />
                            <span className="uppercase tracking-wider text-slate-800">
                                {leaderboardPeriod === 'daily' ? "Today's Rankings" : leaderboardPeriod === 'weekly' ? "Weekly Rankings" : "All Time Rankings"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-200/50 rounded-full border border-slate-200/20 shrink-0">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>

                        {/* Tab Switcher - Consolidated Beside the title */}
                        <div className="bg-white p-0.5 rounded-[8px] border border-slate-200/60 flex items-center shrink-0 w-full sm:w-auto sm:min-w-[240px]">
                            {[
                                { id: 'daily', label: 'Day', data: dailyLeaderboard },
                                { id: 'weekly', label: 'Week', data: weeklyLeaderboard },
                                { id: 'all_time', label: 'All Time', data: allTimeLeaderboard }
                            ].map((p) => {
                                const isActive = leaderboardPeriod === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePeriodChange(p.id, p.data)}
                                        className={`flex-1 py-1 text-center text-[10px] font-black rounded-[6px] transition-all ${
                                            isActive 
                                                ? 'bg-slate-100 text-slate-800 border border-slate-200/20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]' 
                                                : 'text-slate-450 hover:text-slate-650'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-3">
                            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#06b6d4] rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Loading Rankings...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            {/* Leaderboard List */}
                            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-0.5 pb-8 custom-clean-scrollbar">
                                <style>{`
                                    .custom-clean-scrollbar::-webkit-scrollbar {
                                        width: 5px;
                                    }
                                    .custom-clean-scrollbar::-webkit-scrollbar-track {
                                        background: #f8fafc;
                                    }
                                    .custom-clean-scrollbar::-webkit-scrollbar-thumb {
                                        background: #cbd5e1;
                                        border-radius: 5px;
                                    }
                                `}</style>

                                {leaderboard.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                                        No active contenders present for this period.
                                    </div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {leaderboard.slice(0, 10).map((student, idx) => {
                                            const isMe = user && student.id === user._id;
                                            
                                            let rowStyle = 'bg-white border border-slate-100 hover:bg-slate-50';
                                            let rankColor = 'text-slate-400';
                                            let badgeStyle = 'bg-indigo-50 border-indigo-100/50';
                                            let badgeIconColor = 'text-indigo-650 fill-indigo-200';
                                            let badgeTextColor = 'text-indigo-755';

                                            if (isMe) {
                                                rowStyle = 'bg-[#d2f8ff] border-l-4 border-[#06b6d4] shadow-sm';
                                                rankColor = 'text-[#06b6d4]';
                                                badgeStyle = 'bg-[#b5f5ff] border-[#06b6d4]/20';
                                                badgeIconColor = 'text-[#06b6d4] fill-cyan-100';
                                                badgeTextColor = 'text-[#06b6d4] font-black';
                                            } else if (idx === 0) {
                                                rowStyle = 'bg-[#fff1f2] border-l-4 border-[#f43f5e] shadow-sm';
                                                rankColor = 'text-[#e11d48] font-extrabold';
                                                badgeStyle = 'bg-[#ffe4e6] border-[#fecdd3]';
                                                badgeIconColor = 'text-[#e11d48] fill-rose-100';
                                                badgeTextColor = 'text-[#e11d48] font-black';
                                            } else if (idx === 1) {
                                                rowStyle = 'bg-[#f5f3ff] border-l-4 border-[#8b5cf6] shadow-sm';
                                                rankColor = 'text-[#7c3aed] font-extrabold';
                                                badgeStyle = 'bg-[#ede9fe] border-[#ddd6fe]';
                                                badgeIconColor = 'text-[#7c3aed] fill-violet-100';
                                                badgeTextColor = 'text-[#7c3aed] font-black';
                                            } else if (idx === 2) {
                                                rowStyle = 'bg-[#f0fdfa] border-l-4 border-[#14b8a6] shadow-sm';
                                                rankColor = 'text-[#0d9488] font-extrabold';
                                                badgeStyle = 'bg-[#ccfbf1] border-[#99f6e4]';
                                                badgeIconColor = 'text-[#0d9488] fill-teal-100';
                                                badgeTextColor = 'text-[#0d9488] font-black';
                                            }

                                            return (
                                                <motion.div
                                                    key={student.id || idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`flex items-center justify-between p-3.5 rounded-[8px] transition-all ${rowStyle}`}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        
                                                        {/* Rank Number */}
                                                        <span className={`text-xs font-black w-6 text-center ${rankColor}`}>
                                                            #{idx + 1}
                                                        </span>

                                                        {/* Avatar */}
                                                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                            {student.profilePicture ? (
                                                                <img 
                                                                    src={student.profilePicture} 
                                                                    alt={student.name}
                                                                    className="w-full h-full object-cover"
                                                                    crossOrigin="anonymous"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-550 bg-slate-200">
                                                                    {student.name?.charAt(0) || 'S'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Name */}
                                                        <span className={`text-xs sm:text-sm font-bold truncate uppercase tracking-tight ${
                                                            isMe ? 'text-slate-900 font-black' : 'text-slate-700 font-medium'
                                                        }`}>
                                                            {student.name || 'Student'}
                                                        </span>
                                                    </div>

                                                    {/* Points Star Badge matching Dashboard */}
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 ${badgeStyle}`}>
                                                        <Award size={12} className={badgeIconColor} />
                                                        <span className={`text-[12px] ${badgeTextColor}`}>
                                                            {student.points || 0}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* 👤 PERSONAL USER GLORY PANEL */}
                            {user && userRankInfo && !isUserInTopTen && (
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-[#d2f8ff] border-l-4 border-[#06b6d4] shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <div className="h-10 w-10 rounded-full border border-[#06b6d4]/40 overflow-hidden bg-slate-100">
                                                    {user.profilePicture ? (
                                                        <img src={user.profilePicture} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-[#06b6d4] text-white text-base font-black">{user.name?.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <div className="absolute -top-1.5 -right-1.5 bg-[#06b6d4] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                                                    #{userRankInfo.rank}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-[#06b6d4] uppercase tracking-wider mb-0.5">Your Position</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                                                    <span className="bg-white/60 text-[#06b6d4] border border-[#06b6d4]/20 text-[8px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0">
                                                        {user.planTier || 'Basic'} Tier
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/30">
                                            {xpToNext ? (
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[9px] font-black text-indigo-605 uppercase tracking-wider flex items-center gap-1 sm:justify-end">
                                                        <ArrowUp size={10} /> Progress Alert
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        Collect <span className="text-[#06b6d4] font-extrabold">{xpToNext.diff} XP</span> to overtake <span className="text-slate-800 font-bold">{xpToNext.name.split(' ')[0]}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[9px] font-black text-[#06b6d4] uppercase tracking-wider">Top Standings</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">You are in the top ranks of the standings!</p>
                                                </div>
                                            )}

                                            <div className="text-right shrink-0">
                                                <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider mb-0.5">Total XP</p>
                                                <p className="text-lg font-black text-slate-900 leading-none">
                                                    {userRankInfo.points.toLocaleString()} <span className="text-[10px] text-[#06b6d4] font-bold ml-0.5 uppercase">XP</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
