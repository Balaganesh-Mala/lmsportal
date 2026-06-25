import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, Loader } from 'lucide-react';
import { usePopup } from '../context/PopupContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuotePopup = () => {
    const { isPopupOpen, openPopup, closePopup } = usePopup();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setCoursesLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`);

                // Filter out non-finance/technical related courses
                const technicalKeywords = ['Accounting', 'Finance', 'Investment Banking', 'Fund Accounting'];
                const filteredCourses = res.data.filter(course =>
                    technicalKeywords.some(key => course.title.toLowerCase().includes(key))
                );

                setCourses(filteredCourses);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setCoursesLoading(false);
            }
        };
        fetchCourses();

        const hasSeen = sessionStorage.getItem('hasSeenQuotePopup');
        if (!hasSeen) {
            const timer = setTimeout(() => {
                openPopup();
                sessionStorage.setItem('hasSeenQuotePopup', 'true');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [openPopup]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        courseInterested: '',
        source: 'quote_popup',
        message: 'Requesting a quote' // Default message for quotes
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inquiries`, formData);
            setSubmitted(true);
            setTimeout(() => {
                closePopup();
                setSubmitted(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    courseInterested: '',
                    source: 'quote_popup',
                    message: 'Requesting a quote'
                });
            }, 3000);
        } catch (err) {
            console.error('Error submitting quote:', err);
            setError('Something went wrong. Please try again.');
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isPopupOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 bg-opacity-70"
                onClick={closePopup}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={closePopup}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Left Side - Image (Desktop Only) */}
                    <div className="hidden md:block w-1/2 relative bg-indigo-300">
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                            alt="Student Success"
                            className="absolute inset-0 w-full h-full object-cover opacity-100 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-200/10 to-transparent flex flex-col justify-end p-8 text-white">
                            <h3 className="text-2xl font-bold mb-2 text-white">Master Finance & Accounting</h3>
                            <p className="text-white text-sm">Empower your professional journey with Smart Aspirants. Gain the practical, industry-ready financial skills needed to secure your dream role.</p>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 bg-white relative">
                        {!submitted ? (
                            <>
                                <div className="mb-8">
                                    <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase mb-1 block">Get Started</span>
                                    <h2 className="text-3xl font-bold text-gray-900">Request a Quote</h2>
                                    <p className="text-gray-500 mt-2 text-sm">Fill out the form below and our career counselors will get back to you with the best packages.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                                    <div className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Full Name"
                                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email Address"
                                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Phone Number"
                                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                name="courseInterested"
                                                value={formData.courseInterested}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-500 appearance-none ${coursesLoading ? 'opacity-50' : ''}`}
                                                disabled={coursesLoading}
                                            >
                                                <option value="">{coursesLoading ? 'Loading Courses...' : 'Select Interested Course'}</option>
                                                {!coursesLoading && courses.length > 0 ? (
                                                    courses.map(course => (
                                                        <option key={course._id} value={course.title}>
                                                            {course.title}
                                                        </option>
                                                    ))
                                                ) : !coursesLoading && (
                                                    // Fallback options (Finance Oriented)
                                                    <>
                                                        <option value="Global Accounting">Global Accounting</option>
                                                        <option value="Investment Banking">Investment Banking</option>
                                                        <option value="Fund Accounting">Fund Accounting</option>
                                                    </>
                                                )}
                                                {!coursesLoading && <option value="Other">Other</option>}
                                            </select>
                                            {coursesLoading && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader size={16} className="animate-spin text-indigo-500" />
                                                </div>
                                            )}
                                            {!coursesLoading && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 active:transform active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:bg-indigo-400"
                                    >
                                        {loading ? <Loader size={18} className="animate-spin" /> : <>Get My Free Quote <Send size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                                    </button>

                                    <p className="text-center text-xs text-gray-400 mt-4">
                                        No spam. Your data is secure with us.
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h3>
                                <p className="text-gray-500">Thank you for your interest. Our team will contact you shortly.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuotePopup;
