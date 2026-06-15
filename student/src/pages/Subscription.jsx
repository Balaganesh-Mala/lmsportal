import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    CheckCircle2, 
    ShieldCheck, 
    ArrowRight, 
    ArrowLeft,
    Clock, 
    Star, 
    Zap,
    ChevronDown,
    ChevronUp,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Subscription = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [settings, setSettings] = useState(null);
    const [expandedFeatures, setExpandedFeatures] = useState({});
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    
    const user = JSON.parse(localStorage.getItem('studentUser'));

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/subscription-plans`);
                setPlans(data);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            }
        };
        fetchPlans();

        const fetchSettings = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/settings`);
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();

        const loadRazorpayScript = () => {
            return new Promise((resolve) => {
                if (window.Razorpay) return resolve(true);
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };
        loadRazorpayScript();
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchLatestUser = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/students/${user._id}`);
                if (data) {
                    const updatedUser = {
                        ...user,
                        ...data
                    };
                    localStorage.setItem('studentUser', JSON.stringify(updatedUser));
                    
                    const trialActive = updatedUser.trialEndsAt && new Date() < new Date(updatedUser.trialEndsAt);
                    if (updatedUser.isSubscribed || trialActive) {
                        navigate('/dashboard');
                    }
                }
            } catch (error) {
                console.error("Failed to sync user subscription status:", error);
            }
        };
        fetchLatestUser();
    }, [user, navigate]);

    const toggleFeatures = (planId) => {
        setExpandedFeatures(prev => ({
            ...prev,
            [planId]: !prev[planId]
        }));
    };

    const handleApplyCoupon = async (amount) => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const { data } = await axios.get(`${API_URL}/api/coupons/validate`, {
                params: { code: couponCode, amount }
            });
            
            if (data.success) {
                setAppliedCoupon(data);
                toast.success(`Coupon applied! Saved ₹${data.discountAmount}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid coupon');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubscribe = async (plan) => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            
            // 1. Create Order on Backend
            const { data: orderData } = await axios.post(`${API_URL}/api/payment/create-subscription`, {
                studentId: user._id,
                planId: plan._id,
                couponCode: appliedCoupon ? couponCode : null
            });

            if (!orderData.success) {
                toast.error(orderData.message);
                setLoading(false);
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', 
                amount: orderData.amount,
                currency: orderData.currency,
                name: settings?.companyName || "LMS Academy",
                description: plan.title,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post(`${API_URL}/api/payment/verify-subscription`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            studentId: user._id,
                            planId: plan._id,
                            couponId: appliedCoupon?.couponId
                        });

                        if (verifyRes.data.success) {
                            toast.success("Subscription Activated!");
                            // Save complete updated user to localStorage with updated access controls
                            const updatedUser = { 
                                ...user, 
                                ...verifyRes.data.student
                            };
                            localStorage.setItem('studentUser', JSON.stringify(updatedUser));
                            window.location.href = '/dashboard'; // Force reload to refresh permissions
                        } else {
                            toast.error("Payment verification failed.");
                        }
                    } catch (err) {
                        toast.error("Verification error.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#4f46e5",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            toast.error('Failed to initiate payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
            {/* Soft glowing mesh background blobs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[130px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            {/* Back Shortcut Button */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-all duration-300 flex items-center gap-2 font-bold text-xs"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Dashboard</span>
                </button>

                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Star size={10} fill="currentColor" className="text-amber-500" /> Premium Access Hub
                </div>
            </div>

            {/* BENTO GRID ROW 1: Header Dashboard & Summary Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                
                {/* Left Large Bento Card: Dynamic welcome & active subscription state */}
                <div className="lg:col-span-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-md border border-indigo-950">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full">
                        <div>
                            {user?.isSubscribed ? (
                                <>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span className="text-emerald-400 font-extrabold text-[8px] uppercase tracking-widest">Active Plan</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                                        {user.planTier === 'Full' ? 'Platinum' : user.planTier === 'Intermediate' ? 'Gold' : 'Premium'} Tier Active
                                    </h1>
                                    <p className="text-slate-400 text-xs font-semibold">
                                        Full educational syllabus & worksheets access active until <span className="text-white font-bold">{new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/20 rounded-full mb-3">
                                        <span className="text-indigo-400 font-extrabold text-[8px] uppercase tracking-widest">Upgrade Account</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
                                        Unlock Premium Learning
                                    </h1>
                                    <p className="text-slate-400 text-xs font-semibold">
                                        Get unlimited access to school worksheets, gamified scoreboards, and parent performance alerts.
                                    </p>
                                </>
                            )}
                        </div>

                        {user?.isSubscribed && (
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px] shrink-0 self-stretch sm:self-center flex flex-col justify-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Status</span>
                                <span className="text-emerald-400 font-black text-sm">ONLINE</span>
                            </div>
                        )}
                    </div>
                    {/* Background blob */}
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                </div>

                {/* Right Small Bento Card: Quick statistics & trust seals */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Security & Activation</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                                <span className="text-xs font-bold text-slate-600">100% SSL Encrypted Gateway</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="text-indigo-500 shrink-0" size={18} />
                                <span className="text-xs font-bold text-slate-600">Instant Digital Activation</span>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-semibold leading-tight">
                        Cancel or adjust your school subscription tier at any time directly through student dashboard.
                    </div>
                </div>

            </div>

            {/* BENTO GRID ROW 2: The Subscription Pricing Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <AnimatePresence mode="wait">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan._id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className={`bg-white rounded-[32px] border transition-all duration-300 p-8 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-600/5 relative overflow-hidden ${
                                plan.badge 
                                ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                : 'border-slate-200/60 shadow-sm'
                            }`}
                        >
                            {plan.badge && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                                        {plan.badge}
                                    </div>
                                </div>
                            )}

                            <div>
                                {/* Card Header */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                                        {plan.title}
                                    </h3>
                                    {(plan.discountLabel || (appliedCoupon && appliedCoupon.discountAmount > 0)) && (
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Zap size={8} fill="currentColor" /> {appliedCoupon ? `SAVED ₹${appliedCoupon.discountAmount}` : plan.discountLabel}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-baseline gap-1.5 mb-1">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                        ₹{(appliedCoupon ? plan.price - appliedCoupon.discountAmount : plan.price).toLocaleString()}
                                    </span>
                                    {(plan.originalPrice || appliedCoupon) && (
                                        <span className="text-slate-300 text-sm line-through font-bold decoration-2">
                                            ₹{(appliedCoupon ? plan.price : plan.originalPrice).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="text-[10px] font-bold text-slate-400 mb-6">
                                    ₹{((appliedCoupon ? plan.price - appliedCoupon.discountAmount : plan.price) / (plan.type === 'annually' ? 12 : plan.type === 'quarterly' ? 3 : 1)).toFixed(0)}/month equivalent
                                </div>

                                {/* Integrated Coupon section inside pricing card */}
                                <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Coupon Applicator</span>
                                        {appliedCoupon && (
                                            <span className="text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                                                <CheckCircle2 size={8} /> Saved ₹{appliedCoupon.discountAmount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input 
                                            type="text" 
                                            placeholder="COUPONCODE"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        <button 
                                            onClick={() => handleApplyCoupon(plan.price)}
                                            disabled={validatingCoupon}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black px-3 py-1 rounded-lg transition-all disabled:opacity-50 tracking-wider"
                                        >
                                            {validatingCoupon ? '...' : 'APPLY'}
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-slate-100 mb-6" />

                                {/* Features stack list */}
                                <div className="space-y-4 text-left">
                                    {plan.features.map((cat, idx) => (
                                        <div key={idx} className="border-b border-slate-100/50 pb-3 last:border-0 last:pb-0">
                                            <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-2">{cat.category}</span>
                                            <ul className="space-y-2">
                                                {cat.items.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span className="text-[11px] font-semibold text-slate-600 leading-tight">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Action button */}
                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-md shadow-slate-900/5 disabled:opacity-70 text-xs tracking-wide"
                                >
                                    {loading ? 'Processing...' : 'Subscribe & Unlock'}
                                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* BENTO GRID ROW 3: K-12 Subject Value Matrix */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-100/60 rounded-2xl p-5 text-left border border-slate-200/30 flex gap-3.5 items-start">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center font-extrabold shrink-0 text-sm">✓</div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Interactive Syllabus</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Full access to primary and secondary core subjects with gamified lesson plans.</p>
                    </div>
                </div>

                <div className="bg-slate-100/60 rounded-2xl p-5 text-left border border-slate-200/30 flex gap-3.5 items-start">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center font-extrabold shrink-0 text-sm">✓</div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Curriculum Workbooks</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Downloadable digital worksheets and expert-curated mock assignments.</p>
                    </div>
                </div>

                <div className="bg-slate-100/60 rounded-2xl p-5 text-left border border-slate-200/30 flex gap-3.5 items-start">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center font-extrabold shrink-0 text-sm">✓</div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Parent Dashboard</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Direct progress insights and real-time student activity reports.</p>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Subscription;
