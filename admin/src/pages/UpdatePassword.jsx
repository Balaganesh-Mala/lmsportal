import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const UpdatePassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [settings, setSettings] = useState({ siteTitle: 'Smart Aspirants', logoUrl: '' });
    const navigate = useNavigate();

    // Fetch site settings (logo, title)
    useEffect(() => {
        const fetchSettings = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${apiUrl}/api/settings`);
            if (res.data) {
            setSettings(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
        };
        fetchSettings();

        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${apiUrl}/api/admin/reset-password`, {
                token,
                newPassword: password
            });

            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(res.data.message || 'Update failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error occurred while updating password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                        alt="Security Background" 
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 mix-blend-multiply" />
                </div>
                
                <div className="relative z-10 text-center px-10">
                    <h1 className="text-4xl font-bold text-white mb-6">Secure Your Account</h1>
                    <p className="text-indigo-200 text-lg leading-relaxed max-w-md mx-auto">
                        Your security is our priority. Create a strong, unique password to keep your dashboard safe.
                    </p>
                </div>

                {/* Decorative Circles */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-indigo-600 blur-3xl opacity-40"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-600 blur-3xl opacity-40"></div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-24 bg-white">
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
                                {settings.siteTitle.charAt(0)}
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
                        Set New Password
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-10">
                        Create a new password for <strong>{settings.siteTitle}</strong>
                    </p>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-pulse">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl leading-6 font-bold text-gray-900 mb-2">Password Updated!</h3>
                            <p className="text-gray-500 mb-8">
                                Your password has been changed successfully. Redirecting you to the login page...
                            </p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleUpdatePassword}>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
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
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative rounded-lg shadow-sm group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-all" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                        className="block w-full pl-10 pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transform transition hover:-translate-y-0.5"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
