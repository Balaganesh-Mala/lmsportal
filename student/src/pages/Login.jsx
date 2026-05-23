import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock, Star, Quote, Users, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Deterministic dynamic enrollments calculator
const getDynamicStats = () => {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const daySeed = now.getDate() + now.getMonth() * 31 + now.getFullYear();
    const todayBase = 10 + (daySeed % 5);
    const todayMax = 50 + (daySeed % 11);
    const dayProgress = (hours * 60 + mins) / 1440;
    const todayJoined = Math.floor(todayBase + (todayMax - todayBase) * dayProgress);
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekBase = 314 + (daySeed % 15);
    const thisWeek = weekBase + (dayOfWeek * 35) + todayJoined;
    const dayOfMonth = now.getDate();
    const monthBase = 1160 + (daySeed % 40);
    const thisMonth = monthBase + (dayOfMonth * 42) + todayJoined;
    const startDate = new Date('2026-01-01');
    const diffDays = Math.ceil(Math.abs(now - startDate) / (1000 * 60 * 60 * 24));
    const totalStudents = 50000 + (diffDays * 85) + todayJoined;
    return { today: todayJoined, week: thisWeek, month: thisMonth, total: totalStudents };
};



const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [joinCounts, setJoinCounts] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [settings, setSettings] = useState(null);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotStatus, setForgotStatus] = useState({ success: false, message: '' });

    useEffect(() => {
        if (location.state?.error) {
            setError(location.state.error);
            window.history.replaceState(null, '');
        }
    }, [location]);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        axios.get(`${API_URL}/api/settings`).then(r => setSettings(r.data)).catch(() => { });
        axios.get(`${API_URL}/api/reviews?isApproved=true&limit=6`).then(r => {
            if (r.data.success && r.data.data.length > 0) setReviews(r.data.data);
            else setReviews([
                { studentName: 'Aravind Swamy', role: 'Investment Analyst @ Goldman Sachs', reviewText: 'This course completely changed my career trajectory. The financial modeling modules were critical in cracking my technical interviews!', rating: 5, courseTaken: 'Investment Banking Elite' },
                { studentName: 'Meera Deshmukh', role: 'Software Engineer @ Morgan Stanley', reviewText: 'The project-based learning is exceptional. The layout and Course Player features allowed me to learn at my own pace.', rating: 5, courseTaken: 'Full Stack Financial Systems' },
                { studentName: 'Rahul Varma', role: 'Risk Consultant @ PwC', reviewText: 'Outstanding mentorship! The assignments and mock quiz setup made the actual certifications a walk in the park.', rating: 5, courseTaken: 'Advanced Risk Management' },
            ]);
        }).catch(() => { });
        setJoinCounts(getDynamicStats());
    }, []);

    useEffect(() => {
        if (!reviews.length) return;
        const t = setInterval(() => setCurrentReviewIndex(p => (p + 1) % reviews.length), 5000);
        return () => clearInterval(t);
    }, [reviews]);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotStatus({ success: false, message: '' });
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/students/request-reset`, { email: forgotEmail });
            if (res.data.success) { setForgotStatus({ success: true, message: 'Reset link sent! Check your inbox.' }); setForgotEmail(''); }
        } catch (err) {
            setForgotStatus({ success: false, message: err.response?.data?.message || 'Failed to send reset link.' });
        } finally { setForgotLoading(false); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/students/login`, formData);
            if (res.data.success) {
                localStorage.setItem('studentUser', JSON.stringify(res.data.user));
                localStorage.setItem('studentToken', res.data.token);
                localStorage.setItem('showLoginBlast', 'true');
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally { setLoading(false); }
    };

    const stats = [
        { label: 'Today', count: joinCounts.today, icon: Calendar, grad: 'from-violet-500 to-purple-600' },
        { label: 'This Week', count: joinCounts.week, icon: TrendingUp, grad: 'from-blue-500 to-cyan-500' },
        { label: 'This Month', count: joinCounts.month, icon: Users, grad: 'from-emerald-500 to-teal-500' },
        { label: 'Total', count: joinCounts.total, icon: Star, grad: 'from-amber-500 to-orange-500' },
    ];

    const rev = reviews[currentReviewIndex];

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* ── LEFT PANEL ── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
                style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0f2e 60%, #0a0a1a 100%)' }}>

                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
                    <div className="absolute top-1/2 -right-24 w-[400px] h-[400px] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
                    <div className="absolute -bottom-24 left-1/3 w-[350px] h-[350px] rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', animation: 'float 12s ease-in-out infinite' }} />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                {/* Top: Branding */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                    className="relative z-10 flex items-center gap-3">
                    {settings?.logoUrl ? (
                        <img src={settings.logoUrl} alt={settings.siteTitle} className="h-10 w-auto object-contain" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                            {settings?.siteTitle?.charAt(0) || 'F'}
                        </div>
                    )}
                    <span className="text-white font-bold text-lg tracking-tight">{settings?.siteTitle || 'Finwise Careers'}</span>
                </motion.div>

                {/* Middle: Hero content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border"
                            style={{ background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-violet-300 text-xs font-semibold tracking-wider uppercase">India's #1 Career Platform</span>
                        </div>
                        <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
                            Build Your Dream <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Career</span><br />

                            Today.
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm">
                            Join thousands of students who transformed their careers with industry-expert mentorship and hands-on learning.
                        </p>



                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {stats.map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7 + i * 0.1 }}
                                        className="rounded-2xl p-3 text-center border"
                                        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                                        <div className={`w-7 h-7 mx-auto mb-2 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center`}>
                                            <Icon size={13} className="text-white" />
                                        </div>
                                        <div className="text-base font-black text-white">{s.count ? s.count.toLocaleString() : '0'}+</div>
                                        <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5 font-medium">{s.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Review Carousel */}
                        {reviews.length > 0 && rev && (
                            <AnimatePresence mode="wait">
                                <motion.div key={currentReviewIndex}
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4 }}
                                    className="rounded-2xl p-5 border relative overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <Quote className="absolute top-3 right-4 text-white/5" size={40} />
                                    <div className="flex gap-0.5 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className={i < (rev.rating || 5) ? 'text-amber-400' : 'text-slate-700'}
                                                fill={i < (rev.rating || 5) ? 'currentColor' : 'none'} />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2 italic">"{rev.reviewText}"</p>
                                    <div className="flex items-center gap-3">
                                        {rev.studentImage && rev.studentImage !== 'no-photo.jpg' ? (
                                            <img src={rev.studentImage} alt={rev.studentName} className="w-9 h-9 rounded-full object-cover border-2 border-white/10" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                                                {rev.studentName?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-semibold text-white">{rev.studentName}</div>
                                            <div className="text-xs text-slate-500">{rev.role}</div>
                                        </div>
                                    </div>
                                    {/* Dots */}
                                    <div className="flex gap-1.5 mt-4">
                                        {reviews.map((_, i) => (
                                            <button key={i} onClick={() => setCurrentReviewIndex(i)}
                                                className={`h-1 rounded-full transition-all duration-300 ${i === currentReviewIndex ? 'w-6 bg-violet-500' : 'w-1.5 bg-slate-700'}`} />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 bg-white relative overflow-y-auto">
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4)' }} />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-md mx-auto py-12">

                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-violet-600" />
                            <span className="text-violet-600 text-sm font-semibold">Secure Student Portal</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back 👋</h2>
                        <p className="text-gray-500 text-sm">Sign in to continue your learning journey</p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                                <span className="text-red-500 mt-0.5">⚠</span>
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                                <input id="login-email" name="email" type="email" required autoComplete="email"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-gray-50 focus:bg-white focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]"
                                    placeholder="your@email.com" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative group">
                                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                                <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-gray-50 focus:bg-white focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]"
                                    placeholder="••••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600 transition-colors">
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember / Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input type="checkbox" id="remember-me"
                                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                            </label>
                            <button type="button" onClick={() => setShowForgotModal(true)}
                                className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-70 relative overflow-hidden"
                            style={{ background: loading ? '#6d28d9' : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                                ) : 'Sign In to Portal'}
                            </span>
                            {!loading && <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #1d4ed8 100%)' }} />}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">New to the platform?</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Register CTA */}
                    <Link to="/register"
                        className="flex items-center justify-center w-full py-3.5 px-6 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all duration-200">
                        Create Free Account →
                    </Link>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By signing in, you agree to our{' '}
                        <span className="text-violet-600 cursor-pointer hover:underline">Terms of Service</span> &{' '}
                        <span className="text-violet-600 cursor-pointer hover:underline">Privacy Policy</span>
                    </p>
                </motion.div>
            </div>

            {/* ── FORGOT PASSWORD MODAL ── */}
            <AnimatePresence>
                {showForgotModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                            <button onClick={() => { setShowForgotModal(false); setForgotStatus({ success: false, message: '' }); }}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-sm font-bold">✕</button>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                                <Lock size={22} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Reset Password</h3>
                            <p className="text-sm text-gray-500 mb-6">Enter your registered email and we'll send you a reset link.</p>
                            {forgotStatus.message && (
                                <div className={`p-3 mb-4 rounded-xl text-sm flex items-center gap-2 ${forgotStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    <span>{forgotStatus.success ? '✓' : '⚠'}</span>{forgotStatus.message}
                                </div>
                            )}
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
                                    placeholder="your@email.com" />
                                <button type="submit" disabled={forgotLoading}
                                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-70"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-30px) scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default Login;
