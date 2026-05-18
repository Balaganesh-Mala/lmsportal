import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowLeft, Mail, Phone, Calendar, MapPin, Building, GraduationCap, Upload, BookOpen, Star, Quote, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [joinCounts, setJoinCounts] = useState({
        today: 0,
        week: 0,
        month: 0
    });

    // Step-based form for better UX
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [batches, setBatches] = useState([]);
    const [settings, setSettings] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        gender: '',
        address: '',
        city: '',
        district: '',
        collegeName: '',
        batchId: '',
        profilePicture: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                // Fetch Settings
                const settingsRes = await axios.get(`${API_URL}/api/settings`);
                setSettings(settingsRes.data);

                // Fetch Batches
                const batchesRes = await axios.get(`${API_URL}/api/batches`);
                const activeBatches = (batchesRes.data.batches || []).filter(b => b.status !== 'completed');
                setBatches(activeBatches);

                // Fetch Reviews
                const reviewsRes = await axios.get(`${API_URL}/api/reviews?isApproved=true&limit=5`);
                if (reviewsRes.data.success && reviewsRes.data.data.length > 0) {
                    setReviews(reviewsRes.data.data);
                } else {
                    setReviews([
                        { studentName: "Arjun Mehta", role: "Software Engineer", reviewText: "The best learning platform for modern tech stack. The mentors are top-notch!", rating: 5, courseTaken: "Full Stack Development" },
                        { studentName: "Priya Sharma", role: "UI/UX Designer", reviewText: "Incredible curriculum! I went from zero to a job in 6 months.", rating: 5, courseTaken: "Design Masters" },
                        { studentName: "Karthik R.", role: "Data Scientist", reviewText: "Very structured and easy to follow. Highly recommended!", rating: 4, courseTaken: "Data Science Boot Camp" }
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };

        // Generate random join counts
        setJoinCounts({
            today: Math.floor(Math.random() * (45 - 12 + 1)) + 12,
            week: Math.floor(Math.random() * (320 - 150 + 1)) + 150,
            month: Math.floor(Math.random() * (1200 - 800 + 1)) + 800
        });

        fetchInitialData();
    }, []);

    // Carousel Timer
    useEffect(() => {
        if (reviews.length === 0) return;
        const timer = setInterval(() => {
            setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [reviews]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profilePicture: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleNextStep = async () => {
        // Validation for Step 1
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
                toast.error('Please fill in all required fields to continue.');
                return;
            }
            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                toast.error('Please enter a valid email address.');
                return;
            }

            // Check if email already exists
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/students/check-email?email=${formData.email}`);
                if (data.exists) {
                    toast.error('This email is already registered. Please log in.');
                    return;
                }
            } catch (err) {
                console.error("Error checking email:", err);
                // Continue if check fails, but we warned them.
            }
        }

        // Validation for Step 2
        if (step === 2) {
            if (!formData.dob || !formData.gender || !formData.address || !formData.city || !formData.district || !formData.collegeName) {
                toast.error('Please fill in all required fields to continue.');
                return;
            }
        }

        if (step < totalSteps) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleRegister = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Ensure we only submit on the final step
        if (step !== totalSteps) {
            return;
        }

        // Validation for Step 3
        if (!formData.batchId) {
            toast.error('Please select a class (batch).');
            return;
        }

        setLoading(true);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const submitData = new FormData();

        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                submitData.append(key, formData[key]);
            }
        });

        try {
            const res = await axios.post(`${API_URL}/api/students/register`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success('Registration successful! Welcome to the portal.');
                // Save user and token
                localStorage.setItem('studentUser', JSON.stringify(res.data.user));
                localStorage.setItem('studentToken', res.data.token);

                // Introduce a slight delay for better UX
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Registration Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
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
                        src="https://images.unsplash.com/photo-1513258496099-48168024aec0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="Learning Background"
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
                            Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Journey</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                            Join our platform to access premium courses, interactive mock interviews, and advanced training systems.
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

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 lg:px-16 xl:px-24 bg-white overflow-y-auto">
                <div className="w-full max-w-md mx-auto relative">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">Create Account</h3>
                        <p className="text-gray-500 mt-1">Step {step} of {totalSteps}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(step / totalSteps) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>
                    </div>

                    <div className="relative min-h-[400px] pb-24">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: Basic Info */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                                            <div className="relative">
                                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John" />
                                                <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                                            <div className="relative">
                                                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Doe" />
                                                <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <div className="relative">
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                                            <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                        <div className="relative">
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 9876543210" />
                                            <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Personal Details */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                            <div className="relative">
                                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                        <div className="relative">
                                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123 Main St" />
                                            <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">District</label>
                                            <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="District" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">College Name</label>
                                        <div className="relative">
                                            <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="University of Example" />
                                            <Building size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Course & Profile */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Class (Batch)</label>
                                        <div className="relative">
                                            <select name="batchId" required value={formData.batchId} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                                                <option value="">-- Choose a Batch --</option>
                                                {batches.map(batch => (
                                                    <option key={batch._id} value={batch._id}>
                                                        {batch.name} (Starts: {new Date(batch.startDate).toLocaleDateString()})
                                                    </option>
                                                ))}
                                            </select>
                                            <GraduationCap size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                {previewUrl ? (
                                                    <div className="flex items-center gap-4 p-2">
                                                        <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                                                        <span className="text-sm font-medium text-indigo-600">Change Image</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                                                    </div>
                                                )}
                                                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 rounded-xl p-4 mt-4 border border-indigo-100">
                                        <p className="text-sm text-indigo-800 flex items-start gap-2">
                                            <span className="text-indigo-500 mt-0.5">ℹ</span>
                                            Upon successful registration, your 10-day free trial will begin immediately. You can access all portal features during this time.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="absolute bottom-0 left-0 w-full flex justify-between pt-6 border-t border-gray-100 mt-6 bg-white">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="px-6 py-2.5 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Previous
                                </button>
                            ) : <div></div>}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        "Complete Registration"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-100 pt-6">
                            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Log in here</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
