import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowLeft, Lock, Star, Quote, Users, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [joinCounts, setJoinCounts] = useState({
        today: 0,
        week: 0,
        month: 0
    });

    useEffect(() => {
        if (location.state?.error) {
            setError(location.state.error);
            // Clear the error from state so it doesn't persist on refresh
            window.history.replaceState(null, '');
        }
    }, [location]);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/settings`);
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };

        const fetchReviews = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/reviews?isApproved=true&limit=5`);
                if (data.success && data.data.length > 0) {
                    setReviews(data.data);
                } else {
                    // Fallback reviews if none in DB
                    setReviews([
                        { studentName: "Arjun Mehta", role: "Software Engineer", reviewText: "The best learning platform for modern tech stack. The mentors are top-notch!", rating: 5, courseTaken: "Full Stack Development" },
                        { studentName: "Priya Sharma", role: "UI/UX Designer", reviewText: "Incredible curriculum! I went from zero to a job in 6 months.", rating: 5, courseTaken: "Design Masters" },
                        { studentName: "Karthik R.", role: "Data Scientist", reviewText: "Very structured and easy to follow. Highly recommended!", rating: 4, courseTaken: "Data Science Boot Camp" }
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        };

        // Generate random join counts
        setJoinCounts({
            today: Math.floor(Math.random() * (45 - 12 + 1)) + 12,
            week: Math.floor(Math.random() * (320 - 150 + 1)) + 150,
            month: Math.floor(Math.random() * (1200 - 800 + 1)) + 800
        });

        fetchSettings();
        fetchReviews();
    }, []);

    // Carousel Timer
    useEffect(() => {
        if (reviews.length === 0) return;
        const timer = setInterval(() => {
            setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [reviews]);

    // Forgot Password States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotStatus, setForgotStatus] = useState({ success: false, message: '' });

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotStatus({ success: false, message: '' });

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/students/request-reset`, { email: forgotEmail });

            if (res.data.success) {
                setForgotStatus({ success: true, message: 'Reset link sent! Check your inbox.' });
                setForgotEmail(''); // Clear input on success
            }
        } catch (err) {
            setForgotStatus({
                success: false,
                message: err.response?.data?.message || 'Failed to send reset link. Try again.'
            });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${API_URL}/api/students/login`, {
                email: formData.email,
                password: formData.password
            });

            if (res.data.success) {
                // Save user and token to local storage
                localStorage.setItem('studentUser', JSON.stringify(res.data.user));
                localStorage.setItem('studentToken', res.data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative overflow-hidden items-center justify-center">
                {/* Background Animation & Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
                    
                    <img
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="Background"
                        className="w-full h-full object-cover opacity-10 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 via-[#1E293B]/80 to-[#0F172A]/90" />
                </div>

                <div className="relative z-10 w-full max-w-2xl px-12">
                    {/* Header Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Future</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                            Join thousands of students achieving their career goals with our industry-leading curriculum and expert mentorship.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-12">
                        {[
                            { label: 'Today Joined', count: joinCounts.today, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
                            { label: 'This Week', count: joinCounts.week, icon: TrendingUp, color: 'from-indigo-500 to-purple-500' },
                            { label: 'This Month', count: joinCounts.month, icon: Users, color: 'from-pink-500 to-rose-500' }
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl text-center hover:bg-slate-800/60 transition-all group"
                            >
                                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={20} className="text-white" />
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {stat.count}+
                                </div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Review Carousel */}
                    <div className="relative h-48">
                        <AnimatePresence mode='wait'>
                            {reviews.length > 0 && (
                                <motion.div
                                    key={currentReviewIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative overflow-hidden"
                                >
                                    <Quote className="absolute -top-2 -left-2 w-12 h-12 text-white/5 transform -rotate-12" />
                                    
                                    <div className="flex items-center gap-1 mb-4 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                fill={i < (reviews[currentReviewIndex].rating || 5) ? "currentColor" : "none"} 
                                                className={i < (reviews[currentReviewIndex].rating || 5) ? "" : "text-slate-600"}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-slate-300 text-sm italic mb-6 leading-relaxed line-clamp-3">
                                        "{reviews[currentReviewIndex].reviewText}"
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {reviews[currentReviewIndex].studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">
                                                {reviews[currentReviewIndex].studentName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {reviews[currentReviewIndex].role} • {reviews[currentReviewIndex].courseTaken}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Carousel Indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                            {reviews.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentReviewIndex(i)}
                                    className={`h-1 rounded-full transition-all duration-300 ${i === currentReviewIndex ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-24 bg-white relative">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="sm:mx-auto sm:w-full sm:max-w-md"
                >
                    <div className="flex justify-center mb-8">
                        {settings?.logoUrl ? (
                            <motion.img
                                whileHover={{ scale: 1.05 }}
                                src={settings.logoUrl}
                                alt={settings.siteTitle}
                                className="h-20 w-auto object-contain"
                            />
                        ) : (
                            <motion.div 
                                whileHover={{ rotate: 0 }}
                                className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl transform rotate-3 transition-transform"
                            >
                                {settings?.siteTitle ? settings.siteTitle.charAt(0) : 'F'}
                            </motion.div>
                        )}
                    </div>

                    <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-10">
                        Access your student portal dashboard
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="sm:mx-auto sm:w-full sm:max-w-md"
                >
                    <form className="space-y-6" onSubmit={handleLogin}>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-pulse">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <span className="text-red-500 font-bold">⚠</span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                    placeholder="student@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative rounded-lg shadow-sm group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <button type="button" onClick={() => setShowForgotModal(true)} className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Forgot your password?
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transform transition hover:-translate-y-0.5"
                            >
                                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Start your 10-day free trial</Link>
                    </div>
                </motion.div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative"
                    >
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                            <p className="text-sm text-gray-500 mt-2">Enter your email to receive a reset link.</p>
                        </div>

                        {forgotStatus.message && (
                            <div className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${forgotStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                <span>{forgotStatus.success ? '✓' : '⚠'}</span>
                                {forgotStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter your registered email"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={forgotLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center"
                            >
                                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Login;
