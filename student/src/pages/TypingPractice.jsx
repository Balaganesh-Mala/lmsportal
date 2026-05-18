import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw,
    Play,
    RotateCcw,
    Settings,
    Keyboard,
    Trophy,
    Target,
    Clock,
    Zap,
    Volume2,
    VolumeX,
    Type,
    ChevronDown,
    Timer,
    History,
    TrendingUp,
    Award,
    Activity,
    BarChart2,
    ArrowRight,
    Monitor,
    Shield
} from 'lucide-react';

// Inline hand icon — avoids lucide-react's Hand conflicting with browser XRHand API
const HandGuideIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10" />
        <path d="M10 10.5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2V18a6 6 0 0 0 6 6v0a8 8 0 0 0 8-8V11a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" />
    </svg>
);
import { typingLessons } from '../data/typingLessons';
import TypingKeyboard from '../components/Keyboard/TypingKeyboard';
import VirtualKeyboard from '../components/VirtualKeyboard';
import TypingHeatmap from '../components/TypingHeatmap';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

// --- Sound Effects (Web Audio API) ---
// Lazy singleton: AudioContext is created on first use after a user gesture.
let _audioCtx = null;
const getAudioCtx = () => {
    if (!_audioCtx) {
        try {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('AudioContext not available:', e);
            return null;
        }
    }
    return _audioCtx;
};

const playKeyClick = (type = 'click') => {
    const audioCtx = getAudioCtx();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
};

const TypingPractice = () => {
    const navigate = useNavigate();
    // --- Core State ---
    const [category, setCategory] = useState('beginner');
    const [lessonIndex, setLessonIndex] = useState(0);
    const [duration, setDuration] = useState(60);
    const [mode, setMode] = useState('time');
    const [text, setText] = useState('');
    const [input, setInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [categoryCompleted, setCategoryCompleted] = useState(false);

    const [stats, setStats] = useState({
        wpm: 0, accuracy: 100, correctChars: 0, incorrectChars: 0,
    });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [cumulativeErrors, setCumulativeErrors] = useState(0);

    // --- New: Per-key error tracking + keyboard highlight state ---
    const [errorMap, setErrorMap] = useState({}); // { a: 3, s: 1, ... }
    const [lastPressedKey, setLastPressedKey] = useState('');   // correctly typed key → green flash
    const [lastErrorKey, setLastErrorKey] = useState('');       // wrong key pressed → red flash

    // --- UI State ---
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showKeyboard, setShowKeyboard] = useState(true);
    const [showHands, setShowHands] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('all'); // today, week, month, year, all
    const [historyData, setHistoryData] = useState([]);
    const [user, setUser] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(new Set());

    const inputRef = useRef(null);
    const textContainerRef = useRef(null);

    // Next character the student needs to type
    const nextChar = text[input.length] || '';

    // Filtered History Data
    const filteredHistoryData = useMemo(() => {
        if (!historyData) return [];
        const now = Date.now();
        const DayMs = 24 * 60 * 60 * 1000;
        
        return historyData.filter(item => {
            const time = new Date(item.createdAt).getTime();
            if (historyFilter === 'today') {
                const itemDate = new Date(item.createdAt);
                const todayDate = new Date();
                return itemDate.toDateString() === todayDate.toDateString();
            }
            if (historyFilter === 'week') return now - time <= 7 * DayMs;
            if (historyFilter === 'month') return now - time <= 30 * DayMs;
            if (historyFilter === 'year') return now - time <= 365 * DayMs;
            return true;
        });
    }, [historyData, historyFilter]);

    // Calculate aggregate stats for History dashboard
    const historyStats = useMemo(() => {
        if (!filteredHistoryData || filteredHistoryData.length === 0) return { highestWpm: 0, avgAcc: 0, totalTests: 0, totalTime: 0 };
        const maxWpm = Math.max(...filteredHistoryData.map(d => d.wpm || 0));
        const sumAcc = filteredHistoryData.reduce((acc, curr) => acc + (curr.accuracy || 0), 0);
        const sumTime = filteredHistoryData.reduce((acc, curr) => acc + (curr.time || 0), 0);
        return {
            highestWpm: maxWpm,
            avgAcc: (sumAcc / filteredHistoryData.length).toFixed(1),
            totalTests: filteredHistoryData.length,
            totalTime: sumTime
        };
    }, [filteredHistoryData]);

    // Which UI helpers are visible based on category
    const handsVisible = showHands && category === 'beginner' && !isMobile;
    const keyboardVisible = showKeyboard && (category === 'beginner' || category === 'intermediate') && !isMobile;

    useEffect(() => {
        const fetchStudentData = async () => {
            const storedUser = localStorage.getItem('studentUser');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const res = await axios.get(`${API_URL}/api/students/${parsedUser._id}`);
                    const latestUser = res.data;
                    
                    setUser(latestUser);
                    localStorage.setItem('studentUser', JSON.stringify(latestUser));

                    // Sync history to show completed rounds (green dots)
                    fetchHistory(latestUser._id);

                    // Set initial lesson from persisted data with safety fallback
                    const initialCat = latestUser.lastCategory || 'beginner';
                    const safeCat = typingLessons[initialCat] ? initialCat : 'beginner';
                    setCategory(safeCat);
                    
                    const initialIndex = latestUser.lastLessonIndex || 0;
                    const lessonsArray = typingLessons[safeCat] || typingLessons['beginner'];
                    setLessonIndex(initialIndex >= lessonsArray.length ? 0 : initialIndex);
                } catch (err) {
                    console.error('Failed to sync student data', err);
                    setUser(parsedUser);
                    const initialCat = parsedUser.lastCategory || 'beginner';
                    const safeCat = typingLessons[initialCat] ? initialCat : 'beginner';
                    setCategory(safeCat);
                    
                    const initialIndex = parsedUser.lastLessonIndex || 0;
                    const lessonsArray = typingLessons[safeCat] || typingLessons['beginner'];
                    setLessonIndex(initialIndex >= lessonsArray.length ? 0 : initialIndex);
                    
                    // Fetch history to populate completed lessons
                    fetchHistory(parsedUser._id);
                }
            }
        };
        fetchStudentData();
    }, []);

    const fetchHistory = async (studentId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${API_URL}/api/typing/history/${studentId}`);
            setHistoryData(res.data);
            
            // Extract completed lessons (accuracy >= 95 AND wpm >= 35)
            const completed = new Set();
            (res.data || []).forEach(s => {
                if (s.accuracy >= 95 && s.wpm >= 35) {
                    completed.add(`${s.mode}-${s.lesson}`);
                }
            });
            setCompletedLessons(completed);
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    useEffect(() => { loadLesson(); inputRef.current?.focus(); }, [category, lessonIndex]);
    useEffect(() => { setTimeLeft(duration); }, [duration]);

    const loadLesson = () => {
        const lessons = typingLessons[category] || typingLessons['beginner'];
        const lesson = lessons[lessonIndex % lessons.length] || lessons[0];
        setText(lesson.content);
        resetTest();
    };

    // --- Audio init ---
    useEffect(() => {
        const initAudio = () => {
            const ctx = getAudioCtx();
            if (ctx?.state === 'suspended') ctx.resume();
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
        return () => { window.removeEventListener('click', initAudio); window.removeEventListener('keydown', initAudio); };
    }, []);

    const resetTest = () => {
        setInput('');
        setStartTime(null);
        setIsActive(false);
        setIsFinished(false);
        setCategoryCompleted(false); // Reset completion state
        setTimeLeft(mode === 'time' ? duration : 0);
        setStats({ wpm: 0, accuracy: 100, correctChars: 0, incorrectChars: 0 });
        setTotalKeystrokes(0);
        setCumulativeErrors(0);
        setErrorMap({});
        setLastPressedKey('');
        setLastErrorKey('');
        setTestStarted(false); // Reset to show start button
        inputRef.current?.blur();
    };

    const startTest = () => {
        setTestStarted(true);
        inputRef.current?.focus();
    };

    // --- Timer ---
    useEffect(() => {
        let interval = null;
        if (isActive && !isFinished && mode === 'time') {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { finishTest(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isFinished, mode]);

    const handleInput = (e) => {
        if (isFinished || !testStarted) return; 
        const value = e.target.value;

        if (!isActive) {
            setIsActive(true);
            setStartTime(Date.now());
        }

        const newChar = value.slice(-1);
        const targetChar = text[value.length - 1] || '';
        const isAdding = value.length > input.length;

        if (isAdding && soundEnabled) {
            if (newChar !== targetChar) {
                playKeyClick('error');
            } else {
                playKeyClick('click');
            }
        }

        // ── Per-key error tracking ──────────────────
        let newTotal = totalKeystrokes;
        let newErrors = cumulativeErrors;

        if (isAdding) {
            newTotal += 1;
            if (newChar !== targetChar) {
                newErrors += 1;
                // Wrong key pressed → highlight error
                setLastErrorKey(newChar);
                setLastPressedKey('');
                // Accumulate in errorMap
                if (targetChar && targetChar.trim()) {
                    const k = targetChar.toLowerCase();
                    setErrorMap(prev => ({ ...prev, [k]: (prev[k] || 0) + 1 }));
                }
            } else {
                // Correct key pressed → show green flash on keyboard
                setLastPressedKey(newChar);
                setLastErrorKey('');
            }
            setTotalKeystrokes(newTotal);
            setCumulativeErrors(newErrors);
        }

        setInput(value);
        calculateStats(value, newTotal, newErrors);

        if (value.length >= text.length) { finishTest(newTotal, newErrors); }
    };

    const calculateStats = (currentInput, currentTotal = totalKeystrokes, currentErrors = cumulativeErrors) => {
        const elapsedMin = (Date.now() - startTime) / 60000 || 0.0001;
        let correctSeq = 0;
        for (let i = 0; i < currentInput.length; i++) {
            if (currentInput[i] === text[i]) correctSeq++;
        }
        const wpm = Math.max(0, Math.round((correctSeq / 5) / elapsedMin));
        const accuracy = currentTotal > 0 
            ? Math.max(0, Math.round(((currentTotal - currentErrors) / currentTotal) * 100))
            : 100;
        setStats(prev => ({ ...prev, correctChars: correctSeq, incorrectChars: currentErrors, wpm, accuracy }));
    };

    const finishTest = async (finalTotal = totalKeystrokes, finalErrors = cumulativeErrors) => {
        setIsActive(false);
        setIsFinished(true);

        const endTime = Date.now();
        const durationInMinutes = (endTime - (startTime || endTime)) / 60000;
        let correctSeq = 0;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === text[i]) correctSeq++;
        }
        const finalWpm = Math.round((correctSeq / 5) / (durationInMinutes || (1 / 60)));
        const finalAcc = finalTotal > 0 
            ? Math.max(0, Math.round(((finalTotal - finalErrors) / finalTotal) * 100))
            : 100;
        const finalStats = { ...stats, wpm: finalWpm, accuracy: finalAcc, time: durationInMinutes * 60, incorrectChars: finalErrors };
        setStats(finalStats);

        try {
            const storedUser = localStorage.getItem('studentUser');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const saveRes = await axios.post(`${API_URL}/api/typing/save`, {
                    studentId: u._id,
                    wpm: finalWpm,
                    accuracy: finalAcc,
                    errors: stats.incorrectChars,
                    mode: category,
                    lesson: typingLessons[category][lessonIndex]?.title || 'Unknown',
                    time: Math.round(durationInMinutes * 60),
                });
                
                const { pointsAwarded, accuracyThresholdMet } = saveRes.data;
                
                if (accuracyThresholdMet) {
                    const lessonsArray = typingLessons[category] || typingLessons['beginner'];
                    const nextIndex = (lessonIndex + 1);
                    const isEndOfCategory = nextIndex >= lessonsArray.length;
                    const safeNextIndex = isEndOfCategory ? 0 : nextIndex;

                    const updatedUser = { 
                        ...u, 
                        points: (u.points || 0) + (pointsAwarded || 0),
                        lastLessonIndex: safeNextIndex 
                    };
                    localStorage.setItem('studentUser', JSON.stringify(updatedUser));
                    setUser(updatedUser);

                    if (pointsAwarded > 0) {
                        toast.success(`GOAL REACHED! +${pointsAwarded} Points Awarded`, { 
                            icon: '🏆', 
                            duration: 5000,
                            style: { borderRadius: '15px', background: '#333', color: '#fff' }
                        });
                    } else if (!saveRes.data.isFirstCompletion) {
                        toast.success('Lesson Completed! (Already awarded points)', { icon: '✅' });
                    }

                    if (isEndOfCategory) {
                        setCategoryCompleted(true);
                        setLessonIndex(0);
                        
                        // Logic to suggest next category
                        const levelMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                        const currentLevelValue = levelMap[category] || 1;
                        if (currentLevelValue < 3) {
                             toast('New Level Unlocked!', { icon: '🔓', duration: 4000 });
                        }
                    } else {
                        setLessonIndex(nextIndex);
                    }

                    // Optimistic UI update for completed lessons
                    const lessonKey = `${category}-${typingLessons[category][lessonIndex]?.title || 'Unknown'}`;
                    setCompletedLessons(prev => new Set(prev).add(lessonKey));

                } else {
                    toast.error('Accuracy below 95%. No points awarded.', { icon: '⚠️' });
                }

                // Dispatch global sync event for real-time Navbar update
                window.dispatchEvent(new CustomEvent('finwise-activity-sync'));

                toast.success('Progress Saved!', { id: 'save-success' });
                fetchHistory(u._id);
            }
        } catch (err) {
            console.error('Failed to save progress', err);
            toast.error('Failed to save progress.', { id: 'save-fail' });
        }
    };

    const renderText = () => {
        return text.split('').map((char, index) => {
            let className = 'text-2xl font-mono transition-colors duration-75 ';
            const inputChar = input[index];
            if (index === input.length) {
                className += 'border-l-2 border-indigo-500 animate-pulse text-gray-800 bg-gray-200 ';
            }
            if (inputChar == null) className += 'text-gray-400';
            else if (inputChar === char) className += 'text-green-600';
            else className += 'text-red-500 bg-red-100 rounded';
            return <span key={index} className={`${className} ${isMobile ? 'text-lg' : 'text-2xl'}`}>{char}</span>;
        });
    };

    return (
        <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center bg-gray-50 text-gray-800 p-3 md:p-6 font-sans transition-colors duration-300">
            <Toaster position="top-center" reverseOrder={false} />

            {isMobile ? (
                <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-center mb-8 border border-slate-100">
                        <Monitor size={48} className="text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Desktop Recommended</h2>
                    <p className="text-slate-500 font-medium mb-8 max-w-md">
                        Typing Practice is designed for professional skill development using a physical keyboard. 
                        For the best learning experience, please log in from a computer.
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                        <Keyboard size={12} /> Optimized for Physical Keyboards
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-4 md:mb-6 gap-4">

                {/* Lesson selector */}
                <div className="flex items-center justify-between md:justify-start gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Category</span>
                        <div className="relative">
                            <button 
                                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${showCategoryMenu ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                            >
                                {category} <ChevronDown size={14} className={`transition-transform duration-300 ${showCategoryMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                                {showCategoryMenu && (
                                    <>
                                        {/* Invisible backdrop to close menu on outside click */}
                                        <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)}></div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden py-2"
                                        >
                                            {Object.keys(typingLessons).map(cat => {
                                                const TIER_MAP = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                                                const GLOBAL_TIERS = { 'Premium': 3, 'Platinum': 3, 'Full': 3, 'Intermediate': 2, 'Gold': 2, 'Basic': 1 };
                                                const rawTier = user?.planTier || '';
                                                const normalizedTier = rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase();
                                                const studentTier = GLOBAL_TIERS[normalizedTier] || 1;
                                                const isLocked = TIER_MAP[cat.toLowerCase()] > studentTier;

                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => { 
                                                            if (isLocked) {
                                                                toast.error(`Subscribe to unlock ${cat} practice`, { icon: '🔒' });
                                                                navigate('/subscription');
                                                                return;
                                                            }
                                                            setCategory(cat); 
                                                            setLessonIndex(0); 
                                                            setShowCategoryMenu(false);
                                                            resetTest();
                                                        }}
                                                        className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:pl-7 ${category === cat ? 'bg-indigo-50 text-indigo-600' : isLocked ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-2">
                                                                {cat}
                                                                {isLocked && <Shield size={10} className="text-amber-500" />}
                                                            </span>
                                                            {category === cat && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                                            {isLocked && <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">UPGRADE</span>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Mode + Duration */}
                <div className="flex flex-wrap justify-center items-center gap-4 bg-gray-100/50 px-4 py-2 rounded-xl md:rounded-full">
                    <div className="flex items-center gap-2">
                        <Type size={16} className="text-gray-400" />
                        {['time', 'words'].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`text-xs font-bold px-2 py-1 rounded ${mode === m ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-4 bg-gray-300 hidden md:block" />
                    <div className="flex items-center gap-2">
                        <Timer size={16} className="text-gray-400" />
                        {[15, 30, 60, 120].map(s => (
                            <button key={s} onClick={() => { setDuration(s); if (mode === 'time') setTimeLeft(s); }} className={`text-xs font-bold px-2 py-1 rounded ${duration === s ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                {s}s
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center justify-end gap-2 md:gap-3">
                    {/* Toggle Keyboard */}
                    <button
                        onClick={() => setShowKeyboard(!showKeyboard)}
                        className={`p-2 rounded-lg transition-colors ${showKeyboard ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title="Toggle Virtual Keyboard"
                    >
                        <Keyboard size={20} />
                    </button>
                    {/* Toggle Hands (only usable in beginner) */}
                    <button
                        onClick={() => setShowHands(!showHands)}
                        className={`p-2 rounded-lg transition-colors ${showHands ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title="Toggle Hand Guide"
                    >
                        <HandGuideIcon size={20} />
                    </button>
                    <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`} title="History">
                        <History size={20} />
                    </button>
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-100'}`} title="Toggle Sound">
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={resetTest} className="flex items-center gap-2 px-3 py-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200 text-sm">
                        <RotateCcw size={16} /><span>Reset</span>
                    </button>
                </div>
            </div>

            {/* ── Rounds Navigation ───────────────────────────────────────────── */}
            {/* ── Micro Round Navigation ────────────────────────────────────── */}
            <div className="w-full max-w-5xl mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex flex-wrap gap-2">
                    {(typingLessons[category] || []).map((l, i) => {
                        const isSelected = lessonIndex === i;
                        const isDone = completedLessons.has(`${category}-${l.title}`);
                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setLessonIndex(i);
                                    if (testStarted) resetTest();
                                }}
                                title={l.title}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all relative ${
                                    isSelected 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 z-10' 
                                        : isDone 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                            >
                                {i + 1}
                                {isDone && !isSelected && (
                                    <div className="absolute -top-1 -right-1">
                                        <div className="h-3.5 w-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <Trophy size={8} className="text-emerald-500" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── History Panel ───────────────────────────────────────── */}
            {showHistory ? (
                <div className="w-full max-w-5xl bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in relative">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                                <TrendingUp size={32} className="text-indigo-600" /> Performance Dashboard
                            </h2>
                            <p className="text-gray-500 font-medium text-sm mt-1">Track your typing speed, accuracy, and overall growth over time.</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <select 
                                value={historyFilter} 
                                onChange={(e) => setHistoryFilter(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer appearance-none hover:bg-gray-100 transition-colors"
                                style={{ WebkitAppearance: 'none' }}
                            >
                                <option value="today">Today</option>
                                <option value="week">Past 7 Days</option>
                                <option value="month">Past 30 Days</option>
                                <option value="year">Past Year</option>
                                <option value="all">All Time</option>
                            </select>
                            <button onClick={() => setShowHistory(false)} className="px-5 py-2.5 bg-gray-50 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 text-sm font-bold rounded-xl transition-all border border-gray-200 hover:border-indigo-100 flex items-center gap-2">
                                <RotateCcw size={16} /> Back
                            </button>
                        </div>
                    </div>

                    {/* Aggregate Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Trophy size={16}/> Top Speed</h3>
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-black text-emerald-600 tracking-tight">{historyStats.highestWpm}</p>
                                <span className="text-sm font-bold text-emerald-500">WPM</span>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target size={16}/> Avg Accuracy</h3>
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-black text-blue-600 tracking-tight">{historyStats.avgAcc}</p>
                                <span className="text-sm font-bold text-blue-500">%</span>
                            </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-purple-800 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity size={16}/> Total Tests</h3>
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-black text-purple-600 tracking-tight">{historyStats.totalTests}</p>
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-orange-800 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock size={16}/> Total Time</h3>
                            <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-black text-orange-600 tracking-tight">{Math.round(historyStats.totalTime / 60)}</p>
                                <span className="text-sm font-bold text-orange-500">mins</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-4">
                        {/* Area Chart Section */}
                        <div className="lg:col-span-12">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                    <BarChart2 size={24} className="text-indigo-500"/> Speed Progress Overview
                                </h3>
                            </div>
                            <div className="h-64 md:h-[350px] w-full bg-gray-50/50 rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm relative">
                                {filteredHistoryData.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">No results found for this time period</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[...filteredHistoryData].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="createdAt" 
                                                tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                                                stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} dy={15} 
                                            />
                                            <YAxis 
                                                stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', fontWeight: 'bold' }}
                                                labelFormatter={(val) => new Date(val).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                                itemStyle={{ color: '#4f46e5', fontWeight: 900 }}
                                            />
                                            <Area type="monotone" dataKey="wpm" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorWpm)" activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5', shadowColor: '#4f46e5', shadowBlur: 10 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Recent Sessions Table */}
                        <div className="lg:col-span-12">
                            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2"><History size={24} className="text-purple-500"/> Recent Sessions</h3>
                            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-200">
                                            <th className="py-4 px-6 font-bold rounded-tl-2xl">Date & Time</th>
                                            <th className="py-4 px-6 font-bold">Lesson Type</th>
                                            <th className="py-4 px-6 font-bold">Speed</th>
                                            <th className="py-4 px-6 font-bold rounded-tr-2xl">Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredHistoryData.map((item) => (
                                            <tr key={item._id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-900 transition-colors">{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-400 font-semibold">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold capitalize">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> {item.lesson || 'Practice Session'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-indigo-600">{item.wpm}</span>
                                                        <span className="text-xs text-gray-400 font-bold uppercase">WPM</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                                        item.accuracy >= 98 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        item.accuracy >= 90 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                        <div className={`w-2 h-2 rounded-full ${item.accuracy >= 98 ? 'bg-emerald-500' : item.accuracy >= 90 ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                        {item.accuracy}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredHistoryData.length === 0 && (
                                            <tr><td colSpan="4" className="py-16 text-center text-gray-400 font-semibold bg-gray-50/50">No typing history found for this period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Stat Cards ─────────────────────────────────── */}
                    <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                        <StatCard label="Words / Min" value={stats.wpm} icon={Zap} color="text-yellow-600" />
                        <StatCard label="Accuracy" value={`${stats.accuracy}%`} icon={Target} color="text-green-600" />
                        <StatCard label="Errors" value={stats.incorrectChars} icon={Settings} color="text-red-500" />
                        <StatCard label="Time Left" value={mode === 'time' ? `${timeLeft}s` : '∞'} icon={Clock} color="text-blue-500" />
                    </div>

                    {/* ── Unified Keyboard + Hands Overlay ──────────────── */}
                    {keyboardVisible && !isFinished && (
                        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-2">
                            <TypingKeyboard
                                nextKey={nextChar}
                                errorKey={lastErrorKey}
                                showHands={handsVisible}
                            />
                        </div>
                    )}

                    {/* ── Typing Area ────────────────────────────────── */}
                    <div
                        className={`relative w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 flex flex-col justify-center cursor-text transition-all duration-500 ${!testStarted && !isFinished ? 'min-h-[380px]' : 'min-h-[200px] md:min-h-[250px]'}`}
                        onClick={() => inputRef.current?.focus()}
                    >
                        <div className="absolute top-4 left-6 text-xs font-bold text-gray-300 uppercase tracking-widest pointer-events-none">
                            {isActive ? 'Typing...' : isMobile ? 'Tap to Focus & Type' : 'Click to Focus'}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            className="absolute opacity-0 top-0 left-0 h-full w-full cursor-default"
                            value={input}
                            onChange={handleInput}
                            onBlur={() => !isFinished && setIsActive(false)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            inputMode="text"
                            enterKeyHint="done"
                        />

                        <div
                            ref={textContainerRef}
                            className="font-mono text-lg md:text-2xl leading-relaxed text-gray-400 select-none break-words whitespace-pre-wrap max-h-[300px] overflow-hidden"
                            style={{ lineHeight: '1.8' }}
                        >
                            {renderText()}
                        </div>

                        {!testStarted && !isFinished && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-2xl z-20 animate-in fade-in duration-500">
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                
                                <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] relative z-10 max-w-sm w-full mx-4 transform animate-in zoom-in duration-300">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 mb-4 transform hover:rotate-12 transition-transform duration-500 cursor-pointer" onClick={startTest}>
                                        <Play size={24} className="fill-current ml-1" />
                                    </div>
                                    
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Ready to Practice?</h3>
                                        <div className="mt-3 flex flex-col items-center gap-1.5">
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border border-indigo-100/30">
                                                Goal: 35+ WPM
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">To unlock the next level</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={startTest}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 group"
                                    >
                                        Start Session
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <p className="mt-6 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em] text-center">Focus on accuracy first</p>
                                </div>
                            </div>
                        )}

                        {!testStarted && !isFinished && categoryCompleted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-2xl rounded-2xl z-30 overflow-hidden animate-in fade-in zoom-in duration-500">
                                <div className="text-center p-8 text-white max-w-sm w-full mx-4">
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce transition-transform hover:scale-110">
                                        <Award size={40} className="text-yellow-400 fill-current" />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">Level Mastered!</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mb-8">You have completed all {category} rounds</p>
                                    
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => {
                                                const levels = ['beginner', 'intermediate', 'advanced'];
                                                const currentIdx = levels.indexOf(category);
                                                const nextLevel = levels[Math.min(currentIdx + 1, levels.length - 1)];
                                                setCategory(nextLevel);
                                                setLessonIndex(0);
                                                resetTest();
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-950/20"
                                        >
                                            Next Category: {category === 'beginner' ? 'Intermediate' : 'Advanced'}
                                            <ArrowRight size={14} />
                                        </button>
                                        <button 
                                            onClick={resetTest}
                                            className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:text-white transition-all"
                                        >
                                            Restart Curriculm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Progress Bar ────────────────────────────────── */}
                    {mode === 'time' && (
                        <div className="w-full max-w-5xl mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
                            <motion.div
                                className="h-full bg-indigo-500"
                                initial={{ width: '100%' }}
                                animate={{ width: `${(timeLeft / duration) * 100}%` }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </div>
                    )}

                    {/* ── Virtual Keyboard ────────────────────────────── */}
                    {/*keyboardVisible && !isFinished && (
                        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Keyboard size={14} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Virtual Keyboard</span>
                                {nextChar && (
                                    <span className="ml-auto px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                        Next: <code className="font-mono">{nextChar === ' ' ? 'SPACE' : nextChar.toUpperCase()}</code>
                                    </span>
                                )}
                            </div>
                            <VirtualKeyboard
                                nextKey={nextChar}
                                pressedKey={lastPressedKey}
                                errorKey={lastErrorKey}
                            />
                        </div>
                    )*/}
                </>
            )}

            {/* ── Results Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {isFinished && (() => {
                    const accuracyColor = stats.accuracy >= 95 ? '#10b981' : stats.accuracy >= 90 ? '#f59e0b' : '#ef4444';
                    const strokeDasharray = 2 * Math.PI * 55; // radius 55
                    const strokeDashoffset = strokeDasharray * ((100 - stats.accuracy) / 100);

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-md p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.98, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden p-8 relative border border-slate-100 max-h-[95vh] overflow-y-auto"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 leading-tight">Practice Summary</h2>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-2 py-1 rounded-md">{category} Level</span>
                                    </div>
                                </div>

                                {/* Hero Performance Section */}
                                <div className="flex flex-col md:flex-row items-center justify-around gap-8 mb-8">
                                    {/* Accuracy Circle */}
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="64" cy="64" r="55" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                                            <motion.circle 
                                                cx="64" cy="64" r="55" fill="none" stroke={accuracyColor} strokeWidth="5" strokeLinecap="round" 
                                                initial={{ strokeDashoffset: strokeDasharray }}
                                                animate={{ strokeDashoffset }}
                                                style={{ strokeDasharray }}
                                                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-slate-800 tracking-tighter">{stats.accuracy}%</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</span>
                                        </div>
                                    </div>

                                    {/* Speed + Time Info */}
                                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1 text-center md:text-left">Net Speed</p>
                                            <div className="bg-slate-50 p-3 rounded-xl flex items-baseline justify-center md:justify-start gap-2 border border-slate-100/50">
                                                <span className="text-3xl font-mono font-semibold text-slate-800 leading-none">{stats.wpm}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">WPM</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1 text-center md:text-left">Duration</p>
                                            <div className="bg-slate-50 p-3 rounded-xl flex items-baseline justify-center md:justify-start gap-2 border border-slate-100/50">
                                                <span className="text-3xl font-mono font-semibold text-slate-800 leading-none">{Math.round(stats.time || 0)}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">SEC</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Section */}
                                <div className="mb-8">
                                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Performance Profile
                                    </h4>
                                    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm overflow-x-auto">
                                        <TypingHeatmap errorMap={errorMap} hideHeader hideMissedKeys />
                                    </div>
                                </div>

                                {/* Action Strip */}
                                <div className="flex gap-3 items-center">
                                    <button
                                        onClick={resetTest}
                                        className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <RotateCcw size={16} /> Retry
                                    </button>
                                    <button
                                        onClick={() => { 
                                            const lessonsArray = typingLessons[category] || typingLessons['beginner'] || [];
                                            setLessonIndex(prev => (prev + 1) % (lessonsArray.length || 1)); 
                                            resetTest(); 
                                        }}
                                        className="flex-1 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        Next Round <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
            </>
            )}
        </div>
    );
};

// ── Helper Components ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon size={24} className={color} />
        </div>
    </div>
);

const ResultStat = ({ label, value, subtext }) => (
    <div className="text-center">
        <p className="text-4xl md:text-5xl font-black text-gray-800 mb-2">{value}</p>
        <p className="text-gray-500 font-bold uppercase text-sm">{label}</p>
        <p className="text-gray-400 text-xs mt-1">{subtext}</p>
    </div>
);

export default TypingPractice;
