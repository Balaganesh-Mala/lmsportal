import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, API_URL } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [settings, setSettings] = useState({ siteTitle: 'Trainer Portal', logoUrl: '' });

    // Forgot Password States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotStatus, setForgotStatus] = useState({ success: false, message: '' });

    // Fetch site settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${baseUrl}/api/settings`);
                const data = await res.json();
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate('/dashboard');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotStatus({ success: false, message: '' });

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            // Use local axios or fetch since auth context might wrap requests differently
            // but for public route plain axios is fine.
            const res = await axios.post(`${baseUrl}/api/trainer/auth/request-reset`, { email: forgotEmail });

            if (res.data.success) {
                setForgotStatus({ success: true, message: 'Reset link sent! Check your inbox.' });
                setForgotEmail('');
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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="Classroom"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 mix-blend-multiply" />
                </div>

                <div className="relative z-10 text-center px-10">
                    <h1 className="text-4xl font-bold text-white mb-6">Trainer Portal</h1>
                    <p className="text-indigo-200 text-lg leading-relaxed max-w-md mx-auto">
                        Manage your classes, track student progress, and conduct assessments seamlessly.
                    </p>
                </div>

                {/* Decorative Circles */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-indigo-600 blur-3xl opacity-40"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-600 blur-3xl opacity-40"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-24 bg-white relative">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center mb-8">
                        {settings.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt={settings.siteTitle}
                                className="h-20 w-auto object-contain"
                            />
                        ) : (
                            <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl transform rotate-3">
                                {settings.siteTitle ? settings.siteTitle.charAt(0) : 'S'}
                            </div>
                        )}
                    </div>

                    <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-10">
                        Sign in to access your <strong>Trainer Dashboard</strong>
                    </p>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-pulse">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
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
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                    placeholder="trainer@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transform transition hover:-translate-y-0.5"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.
                    </div>
                </div>

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
