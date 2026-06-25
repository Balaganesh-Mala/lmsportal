import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, Clock, Award, Loader, ShieldAlert, X, Sparkles, Lock, FileText, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [realProgress, setRealProgress] = useState(0);
    const [showSecurityNotice, setShowSecurityNotice] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            // Get basics from local storage
            let user = JSON.parse(localStorage.getItem('studentUser'));

            // Fetch fresh student data (for startDate)
            // We need to assume we can get it via ID if available, or just rely on what we have.
            // Ideally typically we fetch /api/students/me or /api/students/:id
            if (user && user._id) {
                try {
                    const studentRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/${user._id}`);
                    user = studentRes.data; // Use fresh data
                    setStudentData(user);
                } catch (e) {
                    console.warn("Could not fetch fresh student details, using local storage", e);
                }

                try {
                    const dashRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/dashboard/${user._id}`);
                    if (dashRes.data?.stats?.batchProgress) {
                        setRealProgress(dashRes.data.stats.batchProgress);
                    }
                } catch (e) {
                    console.warn("Could not fetch dashboard stats", e);
                }
            }

            if (user?._id) {
                // 1. Fetch Student Enrollments (includes primary and bonus)
                const enrollmentRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/batches/student/${user._id}/enrollment`);
                const enrollments = enrollmentRes.data.enrollments || [];

                // 2. Fetch all courses (for fallback matching)
                const coursesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses`);
                const allCourses = coursesRes.data;

                // 3. Map enrollments to course objects with isBonus flag
                let mergedCourses = [];
                enrollments.forEach(e => {
                    if (e.batchId && e.batchId.courses) {
                        e.batchId.courses.forEach(c => {
                            mergedCourses.push({
                                ...c,
                                isBonus: e.isBonus,
                                enrollmentId: e._id,
                                enrollmentProgress: c.progress ?? e.progress
                            });
                        });
                    } else if (e.courseId) {
                        mergedCourses.push({
                            ...e.courseId,
                            isBonus: e.isBonus,
                            enrollmentId: e._id,
                            enrollmentProgress: e.progress
                        });
                    }
                });

                // 4. Fallback: Include legacy courseName if not already covered by enrollments
                if (user.courseName) {
                    const alreadyEnrolledTitles = new Set(mergedCourses.map(c => c.title.toLowerCase().trim()));
                    const legacyCourses = allCourses.filter(c =>
                        c.title.toLowerCase().trim() === user.courseName.toLowerCase().trim() &&
                        !alreadyEnrolledTitles.has(c.title.toLowerCase().trim())
                    );

                    if (legacyCourses.length > 0) {
                        setCourses([...mergedCourses, ...legacyCourses]);
                    } else {
                        setCourses(mergedCourses);
                    }
                } else {
                    setCourses(mergedCourses);
                }

                if (mergedCourses.length === 0 && (!user.courseName)) {
                    toast('No enrolled course found.', { icon: 'ℹ️' });
                }
            } else {
                setCourses([]);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching courses:', err);
            toast.error('Failed to load courses');
            setLoading(false);
        }
    };

    // Helper: Calculate Progress based on Time/Curriculum
    const calculateBatchProgress = (course) => {
        let percent = course.enrollmentProgress ?? realProgress ?? 0;

        let daysPassed = 0;
        if (studentData?.startDate) {
            try {
                const start = new Date(studentData.startDate);
                const today = new Date();
                const diffTime = Math.abs(today - start);
                daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } catch (err) {
                console.error('Error parsing startDate:', err);
            }
        }

        return {
            percent,
            text: percent > 0 ? `${percent}% Completed` : 'Start Learning',
            daysPassed
        };
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center text-indigo-600">
            <Loader className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <div className="max-w-6xl mx-auto px-4 pt-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-2 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                            My Courses
                            <Sparkles className="text-amber-400" size={20} />

                            {/* Blinking Security Icon */}
                            <button
                                onClick={() => setShowSecurityNotice(true)}
                                className="relative flex items-center justify-center ml-1 p-1 hover:bg-rose-50 rounded-full transition-colors group"
                            >
                                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-rose-400 opacity-75"></span>
                                <ShieldAlert size={18} className="text-rose-500 relative z-10" />

                                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                    Content Policy
                                </span>
                            </button>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Access your learning journey and recorded sessions.</p>
                    </div>

                    {studentData && (
                        <div className="flex items-center gap-5">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Batch Progress</p>
                                <p className="text-xl font-black text-slate-900 leading-none">{realProgress}%</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Joining Date</p>
                                <p className="text-sm font-bold text-indigo-600 leading-none">
                                    {new Date(studentData.startDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security Content Modal */}
                <AnimatePresence>
                    {showSecurityNotice && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSecurityNotice(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
                                    <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-widest">
                                        <Lock size={14} /> IP Protection Policy
                                    </div>
                                    <button
                                        onClick={() => setShowSecurityNotice(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-8 text-center space-y-6">
                                    <div className="flex justify-center gap-3">
                                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                                            <Video size={24} />
                                        </div>
                                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                                            <FileText size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Internal Assets Only</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Recorded videos and study notes are strictly for your personal learning. Sharing these materials externally is a severe violation of Smart Aspirants Terms of Service.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-left">
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Strict Policy</p>
                                        <p className="text-xs text-rose-500 font-medium leading-relaxed">
                                            Unauthorized sharing, recording, or distribution will result in **immediate termination** of your course access and permanent blacklisting.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                    <button
                                        onClick={() => setShowSecurityNotice(false)}
                                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                    >
                                        I Acknowledge & Agree
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No courses available.</p>
                    </div>
                ) : (
                    courses.map((course) => {
                        const progress = calculateBatchProgress(course);
                        return (
                            <div key={course._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                                <div className="relative h-48 overflow-hidden bg-gray-100 shrink-0">
                                    <img
                                        src={course.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/course/${course._id}`)}
                                            className="bg-white text-indigo-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                        >
                                            <PlayCircle size={20} />
                                            Resume Learning
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${course.isBonus ? 'text-purple-600 bg-purple-50' : 'text-indigo-600 bg-indigo-50'}`}>
                                            {course.isBonus ? 'Bonus' : (course.skillLevel || 'Course')}
                                        </span>
                                        {course.duration && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} /> {course.duration}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1" title={course.title}>
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                                        {course.description}
                                    </p>

                                    <div className="wb-4 mt-auto pt-4 border-t border-gray-50">
                                        {/* Batch Progress */}
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{progress.percent}% Completed</span>
                                            <span>{progress.text}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${progress.percent}%` }}
                                            ></div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/course/${course._id}`)}
                                            className="w-full py-2.5 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <BookOpen size={16} />
                                            Go to Class
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MyCourses;
