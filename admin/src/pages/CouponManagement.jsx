import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Ticket, 
    Plus, 
    Trash2, 
    Calendar, 
    Percent, 
    Banknote, 
    CheckCircle2, 
    XCircle,
    Loader,
    Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CouponManagement() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: 0,
        expiryDate: '',
        usageLimit: '',
        isActive: true
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/api/coupons`);
            setCoupons(data);
        } catch (error) {
            toast.error('Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCoupon = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/coupons`, newCoupon);
            toast.success('Coupon created successfully');
            setShowAddModal(false);
            setNewCoupon({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minPurchase: 0,
                expiryDate: '',
                usageLimit: '',
                isActive: true
            });
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await axios.delete(`${API_URL}/api/coupons/${id}`);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to delete coupon');
        }
    };

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Ticket className="text-orange-600" size={32} />
                            Coupon Management
                        </h1>
                        <p className="text-slate-500 font-bold text-sm mt-1">Create and manage discounts for subscriptions.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={20} /> CREATE NEW COUPON
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader className="animate-spin text-slate-300" size={48} />
                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mt-6">Loading coupons...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coupons.map((coupon) => (
                            <div key={coupon._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl font-black text-lg tracking-widest border border-orange-100">
                                            {coupon.code}
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(coupon._id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-bold">Discount</span>
                                            <span className="text-slate-900 font-black flex items-center gap-1.5">
                                                {coupon.discountType === 'percentage' ? (
                                                    <><Percent size={14} className="text-orange-500" /> {coupon.discountValue}% Off</>
                                                ) : (
                                                    <><Banknote size={14} className="text-emerald-500" /> ₹{coupon.discountValue} Flat Off</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-bold">Min. Purchase</span>
                                            <span className="text-slate-900 font-black">₹{coupon.minPurchase}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-bold">Expiry</span>
                                            <span className="text-slate-900 font-black flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-400" />
                                                {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Expiry'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-bold">Usage</span>
                                            <span className="text-slate-900 font-black">
                                                {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-6 py-4 border-t flex items-center justify-between ${coupon.isActive ? 'bg-emerald-50/50' : 'bg-slate-50'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${coupon.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {coupon.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
                                </div>
                            </div>
                        ))}

                        {coupons.length === 0 && (
                            <div className="col-span-full py-32 text-center">
                                <Ticket className="mx-auto text-slate-200 mb-6" size={64} />
                                <p className="text-slate-400 font-black text-lg">No coupons found.</p>
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="text-orange-600 font-bold mt-2 hover:underline"
                                >
                                    Create your first coupon code
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900">New Coupon</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCoupon} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coupon Code</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. SAVE50"
                                    value={newCoupon.code}
                                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                    <select 
                                        value={newCoupon.discountType}
                                        onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={newCoupon.discountValue}
                                        onChange={(e) => setNewCoupon({...newCoupon, discountValue: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min Purchase</label>
                                    <input 
                                        type="number" 
                                        value={newCoupon.minPurchase}
                                        onChange={(e) => setNewCoupon({...newCoupon, minPurchase: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usage Limit</label>
                                    <input 
                                        type="number" 
                                        placeholder="No Limit"
                                        value={newCoupon.usageLimit}
                                        onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiry Date</label>
                                <input 
                                    type="date" 
                                    value={newCoupon.expiryDate}
                                    onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-600/20"
                            >
                                CREATE COUPON
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
