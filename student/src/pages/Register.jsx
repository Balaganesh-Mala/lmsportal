import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Phone, Calendar, MapPin, Building, GraduationCap, Upload, Star, Quote, Users, TrendingUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const getDynamicStats = () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const seed = now.getDate() + now.getMonth() * 31 + now.getFullYear();
    const base = 10 + (seed % 5), max = 50 + (seed % 11);
    const today = Math.floor(base + (max - base) * ((h * 60 + m) / 1440));
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const week = (314 + seed % 15) + dow * 35 + today;
    const month = (1160 + seed % 40) + now.getDate() * 42 + today;
    const days = Math.ceil(Math.abs(now - new Date('2026-01-01')) / 86400000);
    return { today, week, month, total: 50000 + days * 85 + today };
};

const STEPS = ['Account', 'Personal', 'Enroll'];

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [revIdx, setRevIdx] = useState(0);
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [batches, setBatches] = useState([]);
    const [settings, setSettings] = useState(null);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', phone: '',
        dob: '', gender: '', address: '', city: '', district: '',
        collegeName: '', batchId: '', profilePicture: null
    });

    useEffect(() => {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        axios.get(`${API}/api/settings`).then(r => setSettings(r.data)).catch(() => {});
        axios.get(`${API}/api/batches`).then(r => setBatches((r.data.batches || []).filter(b => b.status !== 'completed'))).catch(() => {});
        axios.get(`${API}/api/reviews?isApproved=true&limit=5`).then(r => {
            if (r.data.success && r.data.data.length > 0) setReviews(r.data.data);
            else setReviews([
                { studentName: 'Aravind Swamy', role: 'Analyst @ Goldman Sachs', reviewText: 'This course changed my career. The financial modeling modules were critical in cracking my interviews!', rating: 5, courseTaken: 'Investment Banking Elite' },
                { studentName: 'Meera Deshmukh', role: 'Engineer @ Morgan Stanley', reviewText: 'Exceptional project-based learning. I could learn complex architectures at my own pace.', rating: 5, courseTaken: 'Full Stack Financial Systems' },
                { studentName: 'Rahul Varma', role: 'Consultant @ PwC', reviewText: 'Outstanding mentorship! The mock quiz setup made the actual certifications a walk in the park.', rating: 5, courseTaken: 'Advanced Risk Management' },
            ]);
        }).catch(() => {});
        setStats(getDynamicStats());
    }, []);

    useEffect(() => {
        if (!reviews.length) return;
        const t = setInterval(() => setRevIdx(p => (p + 1) % reviews.length), 5000);
        return () => clearInterval(t);
    }, [reviews]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const nextStep = async () => {
        if (step === 1) {
            if (!form.firstName || !form.lastName || !form.email || !form.password || !form.phone)
                return toast.error('Fill all required fields');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Invalid email');
            try {
                const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API}/api/students/check-email?email=${form.email}`);
                if (data.exists) return toast.error('Email already registered');
            } catch {}
        }
        if (step === 2 && (!form.dob || !form.gender || !form.address || !form.city || !form.district || !form.collegeName))
            return toast.error('Fill all required fields');
        if (step < 3) setStep(s => s + 1);
    };

    const submit = async () => {
        if (!form.batchId) return toast.error('Select a batch');
        setLoading(true);
        try {
            const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            const res = await axios.post(`${API}/api/students/register`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                toast.success('Registration successful!');
                localStorage.setItem('studentUser', JSON.stringify(res.data.user));
                localStorage.setItem('studentToken', res.data.token);
                setTimeout(() => navigate('/dashboard'), 1200);
            }
        } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
        finally { setLoading(false); }
    };

    const rev = reviews[revIdx];
    const statCards = [
        { label: 'Today', val: stats.today, icon: Calendar, g: 'from-violet-500 to-purple-600' },
        { label: 'This Week', val: stats.week, icon: TrendingUp, g: 'from-blue-500 to-cyan-500' },
        { label: 'This Month', val: stats.month, icon: Users, g: 'from-emerald-500 to-teal-500' },
        { label: 'Total', val: stats.total, icon: Star, g: 'from-amber-500 to-orange-500' },
    ];

    const inputCls = "w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]";
    const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Inter',sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* LEFT PANEL */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
                style={{ background: 'linear-gradient(135deg,#0a0a1a 0%,#0d1117 40%,#0f0f2e 100%)' }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
                    <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle,#2563eb,transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                {/* Brand */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex items-center gap-3">
                    {settings?.logoUrl
                        ? <img src={settings.logoUrl} alt={settings.siteTitle} className="h-10 w-auto object-contain" />
                        : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{settings?.siteTitle?.charAt(0) || 'F'}</div>
                    }
                    <span className="text-white font-bold text-lg">{settings?.siteTitle || 'Finwise Careers'}</span>
                </motion.div>

                {/* Hero */}
                <div className="relative z-10 flex-1 flex flex-col justify-center py-6">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 border"
                            style={{ background: 'rgba(124,58,237,.15)', borderColor: 'rgba(124,58,237,.3)' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-violet-300 text-xs font-semibold tracking-wider uppercase">Join 50,000+ Students</span>
                        </div>
                        <h1 className="text-4xl font-black text-white leading-tight mb-4">
                            Start Your<br />
                            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Success Story
                            </span><br />Today.
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
                            Get access to expert-led courses, hands-on projects, and career support — all in one platform.
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {statCards.map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: .4 + i * .1 }}
                                        className="rounded-2xl p-2.5 text-center border"
                                        style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.07)' }}>
                                        <div className={`w-7 h-7 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${s.g} flex items-center justify-center`}>
                                            <Icon size={12} className="text-white" />
                                        </div>
                                        <div className="text-sm font-black text-white">{s.val ? s.val.toLocaleString() : '0'}+</div>
                                        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-medium">{s.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Review */}
                        {rev && (
                            <AnimatePresence mode="wait">
                                <motion.div key={revIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: .35 }} className="rounded-2xl p-4 border relative"
                                    style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.07)' }}>
                                    <Quote className="absolute top-3 right-3 text-white/5" size={32} />
                                    <div className="flex gap-0.5 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={11} className={i < (rev.rating || 5) ? 'text-amber-400' : 'text-slate-700'}
                                                fill={i < (rev.rating || 5) ? 'currentColor' : 'none'} />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 text-xs leading-relaxed mb-3 line-clamp-2 italic">"{rev.reviewText}"</p>
                                    <div className="flex items-center gap-2">
                                        {rev.studentImage && rev.studentImage !== 'no-photo.jpg'
                                            ? <img src={rev.studentImage} alt={rev.studentName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{rev.studentName?.charAt(0)}</div>
                                        }
                                        <div>
                                            <div className="text-xs font-semibold text-white">{rev.studentName}</div>
                                            <div className="text-[10px] text-slate-500">{rev.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mt-3">
                                        {reviews.map((_, i) => (
                                            <button key={i} onClick={() => setRevIdx(i)}
                                                className={`h-1 rounded-full transition-all ${i === revIdx ? 'w-5 bg-violet-500' : 'w-1.5 bg-slate-700'}`} />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-white relative overflow-y-auto">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg,#7c3aed,#2563eb,#06b6d4)' }} />

                <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-16 py-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto">

                        {/* Header */}
                        <div className="mb-7">
                            <h2 className="text-2xl font-black text-gray-900 mb-1">Create your account 🚀</h2>
                            <p className="text-gray-500 text-sm">Step {step} of 3 — {STEPS[step - 1]}</p>
                            <div className="flex gap-2 mt-4">
                                {STEPS.map((s, i) => (
                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
                                ))}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {/* STEP 1 */}
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[['firstName', 'First Name', 'John'], ['lastName', 'Last Name', 'Doe']].map(([k, label, ph]) => (
                                            <div key={k}>
                                                <label className={labelCls}>{label}</label>
                                                <div className="relative">
                                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} className={inputCls} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email Address</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Password</label>
                                        <div className="relative">
                                            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]" />
                                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600">
                                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Phone Number</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Date of Birth</label>
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Gender</label>
                                            <select value={form.gender} onChange={e => set('gender', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-violet-500">
                                                <option value="">Select</option>
                                                {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Address</label>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[['city', 'City', 'Hyderabad'], ['district', 'District', 'Rangareddy']].map(([k, label, ph]) => (
                                            <div key={k}>
                                                <label className={labelCls}>{label}</label>
                                                <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-violet-500" />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className={labelCls}>College / Institution</label>
                                        <div className="relative">
                                            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={form.collegeName} onChange={e => set('collegeName', e.target.value)} placeholder="Your college name" className={inputCls} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                                    <div>
                                        <label className={labelCls}>Select Class / Batch</label>
                                        <div className="relative">
                                            <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select value={form.batchId} onChange={e => set('batchId', e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white focus:border-violet-500 appearance-none">
                                                <option value="">-- Choose a Batch --</option>
                                                {batches.map(b => <option key={b._id} value={b._id}>{b.name} (Starts: {new Date(b.startDate).toLocaleDateString()})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Profile Picture <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <label htmlFor="pic-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-violet-50 hover:border-violet-400 transition-all">
                                            {preview ? (
                                                <div className="flex items-center gap-4 p-3">
                                                    <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                                                    <span className="text-sm font-medium text-violet-600">Change Photo</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center py-4">
                                                    <Upload size={24} className="text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                                </div>
                                            )}
                                            <input id="pic-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                                const f = e.target.files[0];
                                                if (f) { set('profilePicture', f); setPreview(URL.createObjectURL(f)); }
                                            }} />
                                        </label>
                                    </div>
                                    <div className="rounded-xl p-4 border" style={{ background: 'rgba(124,58,237,.05)', borderColor: 'rgba(124,58,237,.15)' }}>
                                        <p className="text-sm text-violet-800 flex items-start gap-2">
                                            <span className="text-violet-500 font-bold mt-0.5">ℹ</span>
                                            Your 10-day free trial starts immediately after registration. Full access to all portal features included.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Nav Buttons */}
                        <div className="flex items-center justify-between mt-7 pt-5 border-t border-gray-100">
                            {step > 1 ? (
                                <button onClick={() => setStep(s => s - 1)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    ← Back
                                </button>
                            ) : (
                                <Link to="/login" className="text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors">Already have an account?</Link>
                            )}
                            {step < 3 ? (
                                <button onClick={nextStep}
                                    className="px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                                    Continue →
                                </button>
                            ) : (
                                <button onClick={submit} disabled={loading}
                                    className="px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 flex items-center gap-2"
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                                    {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : 'Complete Registration ✓'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`@keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-25px) scale(1.04)} }`}</style>
        </div>
    );
};

export default Register;
