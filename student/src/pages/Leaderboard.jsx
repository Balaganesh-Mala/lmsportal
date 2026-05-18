import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Star, Zap, Award } from 'lucide-react';
import axios from 'axios';

// Assets
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

    // Period Change Handler
    const handlePeriodChange = (period, data) => {
        setLeaderboardPeriod(period);
        setLeaderboard(data);
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-slate-50 font-outfit">
            
            {/* Content Wrapper with Padding */}
            <div className="relative z-10 p-4 md:p-8">
                {/* Header Section (Period Toggle Only) */}
                <div className="flex justify-end mb-10">

                {/* Period Toggle */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm"
                >
                    {[
                        { id: 'daily', label: 'Day', data: dailyLeaderboard },
                        { id: 'weekly', label: 'Week', data: weeklyLeaderboard },
                        { id: 'all_time', label: 'All Time', data: allTimeLeaderboard }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handlePeriodChange(p.id, p.data)}
                            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${leaderboardPeriod === p.id
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </motion.div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-screen-2xl mx-auto items-start">
                
                {/* LEFT SIDE: PODIUM FRAMES (Vertical Champions) */}
                <div className="lg:col-span-4 flex flex-col space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full mb-4 shadow-sm"
                            />
                            <p className="text-slate-500 font-bold text-xs tracking-widest uppercase animate-pulse">Summoning Champions...</p>
                        </div>
                    ) : (
                        <>
                            {/* Rank 1 Frame */}
                            {leaderboard[0] && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4 p-4 bg-white border border-yellow-200 rounded-[2rem] relative overflow-hidden shadow-xl"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl -mr-16 -mt-16" />
                                    <div className="relative h-24 w-24 flex-shrink-0 z-10">
                                        <img src={rank1Frame} className="relative z-20 h-full w-full object-contain" alt="Frame" />
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-yellow-400 bg-slate-100 -mt-1.5">
                                                {leaderboard[0].profilePicture ? (
                                                    <img src={leaderboard[0].profilePicture} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-yellow-500 text-white text-lg font-black">{leaderboard[0].name?.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-slate-900 font-black uppercase text-sm tracking-tight mb-0.5">{leaderboard[0].name}</p>
                                        <p className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.2em] mb-2">Grand Champion</p>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-yellow-500 px-2 py-0.5 rounded text-white font-black text-[9px]">RANK 1</div>
                                            <div className="text-base font-black text-slate-900">{leaderboard[0].points.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">XP</span></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Rank 2 Frame */}
                            {leaderboard[1] && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-[2rem] relative overflow-hidden shadow-lg"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/5 blur-2xl -mr-12 -mt-12" />
                                    <div className="relative h-20 w-20 flex-shrink-0 z-10">
                                        <img src={rank2Frame} className="relative z-20 h-full w-full object-contain" alt="Frame" />
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-100">
                                                {leaderboard[1].profilePicture ? (
                                                    <img src={leaderboard[1].profilePicture} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-400 text-white text-base font-black">{leaderboard[1].name?.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-slate-800 font-black uppercase text-xs tracking-tight mb-0.5">{leaderboard[1].name}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Legendary Contender</p>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-black text-[9px] border border-slate-200">RANK 2</div>
                                            <div className="text-sm font-black text-slate-700">{leaderboard[1].points.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">XP</span></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Rank 3 Frame */}
                            {leaderboard[2] && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-[2rem] relative overflow-hidden shadow-lg"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 blur-2xl -mr-12 -mt-12" />
                                    <div className="relative h-20 w-20 flex-shrink-0 z-10">
                                        <img src={rank3Frame} className="relative z-20 h-full w-full object-contain" alt="Frame" />
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-200 bg-slate-100">
                                                {leaderboard[2].profilePicture ? (
                                                    <img src={leaderboard[2].profilePicture} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-orange-400 text-white text-base font-black">{leaderboard[2].name?.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-slate-800 font-black uppercase text-xs tracking-tight mb-0.5">{leaderboard[2].name}</p>
                                        <p className="text-[8px] font-black text-orange-600/50 uppercase tracking-[0.2em] mb-1.5">Elite Contender</p>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-orange-50 px-2 py-0.5 rounded text-orange-600 font-black text-[9px] border border-orange-100">RANK 3</div>
                                            <div className="text-sm font-black text-slate-700">{leaderboard[2].points.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">XP</span></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT SIDE: TOP 10 LIST */}
                <div className="lg:col-span-8 flex flex-col w-full">
                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-xl max-h-[calc(100vh-280px)]">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                                <Star className="text-yellow-500 fill-yellow-500 w-4 h-4" />
                                Top Contenders
                            </h3>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Top 10 Only</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {leaderboard.slice(3, 10).map((student, idx) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`group relative flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${user && user._id === student.id
                                            ? 'bg-indigo-50 border border-indigo-100 shadow-sm'
                                            : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <span className="text-sm font-black w-6 text-center block text-slate-300">
                                                    {idx + 4}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full overflow-hidden border-2 shadow-sm transition-transform duration-300 group-hover:scale-110 border-slate-100">
                                                    {student.profilePicture ? (
                                                        <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-400">
                                                            {student.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight transition-colors text-slate-900 group-hover:text-indigo-600">
                                                    {student.name}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Zap size={8} className="text-blue-500 fill-blue-500" />
                                                    Active Learner
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg group-hover:border-indigo-200 transition-colors">
                                            <span className="text-xs font-black transition-colors text-slate-600">
                                                {student.points.toLocaleString()} <span className="text-[8px] font-bold opacity-60 ml-0.5">XP</span>
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Current User Summary Card */}
                        {user && userRankInfo && (
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: 0 }}
                                className="p-4 border-t border-slate-100 bg-slate-50/80"
                            >
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-indigo-200 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full border-2 border-indigo-400 overflow-hidden relative z-10 shadow-sm">
                                                {user.profilePicture ? (
                                                    <img src={user.profilePicture} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white text-base font-black">{user.name?.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white z-20">
                                                #{userRankInfo.rank}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-0.5">Your Glory</p>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">You</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total XP</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">
                                            {userRankInfo.points.toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5 uppercase">XP</span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default Leaderboard;
