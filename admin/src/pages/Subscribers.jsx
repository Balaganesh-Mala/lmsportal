import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Users as UsersIcon, 
    Search as SearchIcon, 
    Calendar as CalendarIcon, 
    ShieldCheck as ShieldCheckIcon, 
    Clock as ClockIcon, 
    AlertCircle as AlertCircleIcon, 
    Edit as EditIcon, 
    Save as SaveIcon, 
    X as XIcon,
    Filter as FilterIcon,
    ArrowUpRight as ArrowUpRightIcon,
    UserCircle as UserCircleIcon,
    CheckCircle2 as CheckCircle2Icon,
    XCircle as XCircleIcon
} from 'lucide-react';

const Subscribers = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTier, setFilterTier] = useState('All');
    const [editingSub, setEditingSub] = useState(null);
    const [editForm, setEditForm] = useState({
        planId: '',
        tier: '',
        expiresAt: '',
        isSubscribed: true
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchSubscribers();
        fetchPlans();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/students/subscribers`);
            setSubscribers(data);
        } catch (error) {
            toast.error("Failed to load subscribers");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/subscription-plans`);
            setPlans(data);
        } catch (error) {
            console.error("Failed to load plans");
        }
    };

    const handleEdit = (sub) => {
        setEditingSub(sub);
        setEditForm({
            planId: sub.activePlan?._id || '',
            tier: sub.planTier || 'Basic',
            expiresAt: sub.subscriptionExpiresAt ? new Date(sub.subscriptionExpiresAt).toISOString().split('T')[0] : '',
            isSubscribed: sub.isSubscribed
        });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${API_URL}/api/students/update-subscription/${editingSub._id}`, editForm);
            toast.success("Subscription updated");
            setEditingSub(null);
            fetchSubscribers();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const filteredSubscribers = subscribers.filter(sub => {
        const name = sub.name || '';
        const email = sub.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = filterTier === 'All' || sub.planTier === filterTier;
        return matchesSearch && matchesTier;
    });

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Full': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Intermediate': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Basic': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <UsersIcon className="text-indigo-600" size={32} /> Subscriber Base
                    </h1>
                    <p className="text-slate-500 font-medium">Manage active learning plans and access control</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                    </div>
                    <select 
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:outline-none"
                    >
                        <option value="All">All Tiers</option>
                        <option value="Full">Platinum (Full)</option>
                        <option value="Intermediate">Gold (Intermediate)</option>
                        <option value="Basic">Premium (Basic)</option>
                    </select>
                </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Plan</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tier</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Expiry</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSubscribers.map((sub) => {
                                const isExpired = sub.subscriptionExpiresAt && new Date(sub.subscriptionExpiresAt) < new Date();
                                return (
                                    <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {(sub.name || 'S').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{sub.name}</p>
                                                    <p className="text-xs text-slate-500">{sub.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheckIcon size={16} className="text-indigo-500" />
                                                <span className="text-sm font-bold text-slate-700">
                                                    {sub.activePlan?.title || 'Custom Access'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold ml-6 uppercase">{sub.activePlan?.duration || 'Manual'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getTierColor(sub.planTier)}`}>
                                                {sub.planTier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {isExpired ? (
                                                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px] uppercase">
                                                    <XCircleIcon size={14} /> Expired
                                                </div>
                                            ) : sub.isSubscribed ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase">
                                                    <CheckCircle2Icon size={14} /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase">
                                                    <ClockIcon size={14} /> Inactive
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <CalendarIcon size={14} className="text-slate-300" />
                                                {sub.subscriptionExpiresAt ? new Date(sub.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </div>
                                            {isExpired && <p className="text-[10px] text-rose-400 font-bold ml-6 italic">Access Blocked</p>}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => handleEdit(sub)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <EditIcon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingSub && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <UserCircleIcon className="text-indigo-600" /> Modify Access
                            </h3>
                            <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-slate-600"><XIcon size={24} /></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Student</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-slate-700">
                                    {editingSub.name}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Access Tier</label>
                                    <select 
                                        value={editForm.tier}
                                        onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                                    >
                                        <option value="Basic">Basic</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Full">Full</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Plan Link</label>
                                    <select 
                                        value={editForm.planId}
                                        onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                                    >
                                        <option value="">Manual Entry</option>
                                        {plans.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Expiry Date</label>
                                <input 
                                    type="date"
                                    value={editForm.expiresAt}
                                    onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <input 
                                    type="checkbox"
                                    id="isSub"
                                    checked={editForm.isSubscribed}
                                    onChange={(e) => setEditForm({ ...editForm, isSubscribed: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="isSub" className="text-sm font-bold text-slate-700 select-none">Mark as Active Subscriber</label>
                            </div>
                        </div>

                        <div className="p-8 pt-0 flex gap-3">
                            <button 
                                onClick={() => setEditingSub(null)}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdate}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <SaveIcon size={20} /> Update Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscribers;
