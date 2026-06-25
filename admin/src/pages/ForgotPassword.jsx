import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({ siteTitle: 'Smart Aspirants', logoUrl: '' });

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
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/admin/request-reset`, { email });

      if (res.data.success) {
        setSubmitted(true);
      } else {
        setError(res.data.message || 'Request failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to server');
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
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                alt="Office Background" 
                className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 text-center px-10">
            <h1 className="text-4xl font-bold text-white mb-6">Account Recovery</h1>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-md mx-auto">
                Don't worry, it happens to the best of us. We'll help you get back into your account in no time.
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
                Reset Password
            </h2>
            <p className="text-center text-gray-500 text-sm mb-10">
                Enter your email for <strong>{settings.siteTitle}</strong> admin access
            </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {submitted ? (
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-bounce">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl leading-6 font-bold text-gray-900 mb-2">Check your email</h3>
                <p className="text-gray-500 mb-8">
                    We've sent a password reset link to <br/>
                    <strong className="text-gray-800">{email}</strong>
                </p>
                
                <Link 
                    to="/login" 
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    Return to Sign In
                </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
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
                            placeholder="admin@example.com"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transform transition hover:-translate-y-0.5"
                    >
                        {loading ? 'Sending Request...' : 'Send Reset Link'}
                    </button>
                </div>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
