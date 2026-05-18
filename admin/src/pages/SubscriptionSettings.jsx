import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Save, 
    X, 
    Check, 
    Package, 
    IndianRupee, 
    Calendar,
    List,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionSettings = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const initialPlan = {
        title: '',
        type: 'monthly',
        duration: '1 Month',
        price: 0,
        originalPrice: 0,
        discountLabel: '',
        badge: '',
        features: [
            { category: 'Class', items: [] },
            { category: 'After Class', items: [] }
        ],
        isActive: true,
        order: 0,
        accessLevel: 'Basic'
    };

    const [formData, setFormData] = useState(initialPlan);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/subscription-plans`);
            setPlans(data);
        } catch (error) {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await axios.put(`${API_URL}/api/subscription-plans/${editingPlan._id}`, formData);
                toast.success("Plan updated successfully");
            } else {
                await axios.post(`${API_URL}/api/subscription-plans`, formData);
                toast.success("New plan created");
            }
            fetchPlans();
            setEditingPlan(null);
            setIsAdding(false);
            setFormData(initialPlan);
        } catch (error) {
            toast.error("Save failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this plan?")) return;
        try {
            await axios.delete(`${API_URL}/api/subscription-plans/${id}`);
            toast.success("Plan deleted");
            fetchPlans();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const addFeatureItem = (catIdx) => {
        const newFeatures = [...formData.features];
        newFeatures[catIdx].items.push('');
        setFormData({ ...formData, features: newFeatures });
    };

    const updateFeatureItem = (catIdx, itemIdx, value) => {
        const newFeatures = [...formData.features];
        newFeatures[catIdx].items[itemIdx] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const removeFeatureItem = (catIdx, itemIdx) => {
        const newFeatures = [...formData.features];
        newFeatures[catIdx].items.splice(itemIdx, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Subscription Plans</h1>
                    <p className="text-slate-500">Manage pricing and features for your students</p>
                </div>
                {!isAdding && !editingPlan && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Plus size={20} /> Add New Plan
                    </button>
                )}
            </div>

            {/* Editor Form */}
            {(isAdding || editingPlan) && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden mb-12">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="font-black text-slate-800 uppercase tracking-wider">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </h2>
                        <button onClick={() => { setIsAdding(false); setEditingPlan(null); setFormData(initialPlan); }} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleSave} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Basic Info */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Plan Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        placeholder="e.g. Olympiad Math Mastery"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Type</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="annually">Annually</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Duration Text</label>
                                        <input 
                                            type="text" 
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                            placeholder="1 Month"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Price (₹)</label>
                                        <input 
                                            type="number" 
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Original Price</label>
                                        <input 
                                            type="number" 
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Badges & Labels */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Badge Text</label>
                                    <input 
                                        type="text" 
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                        placeholder="Most Recommended"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Discount Label</label>
                                    <input 
                                        type="text" 
                                        value={formData.discountLabel}
                                        onChange={(e) => setFormData({ ...formData, discountLabel: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                        placeholder="21% OFF"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Access Level</label>
                                    <select 
                                        value={formData.accessLevel}
                                        onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                                    >
                                        <option value="Basic">Basic (Premium)</option>
                                        <option value="Intermediate">Intermediate (Gold)</option>
                                        <option value="Full">Full (Platinum)</option>
                                    </select>
                                    <p className="mt-2 text-[10px] text-slate-400 font-medium italic">* Controls content restriction tiers</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Display Order</label>
                                    <input 
                                        type="number" 
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                                    />
                                </div>
                            </div>

                            {/* Features Builder */}
                            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                                <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <List size={18} className="text-indigo-600" /> Plan Features
                                </h3>
                                {formData.features.map((cat, catIdx) => (
                                    <div key={catIdx} className="mb-8">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                            {cat.category}
                                        </div>
                                        <div className="space-y-3">
                                            {cat.items.map((item, itemIdx) => (
                                                <div key={itemIdx} className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        value={item}
                                                        onChange={(e) => updateFeatureItem(catIdx, itemIdx, e.target.value)}
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                                                        placeholder="Feature item..."
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeFeatureItem(catIdx, itemIdx)}
                                                        className="text-rose-400 hover:text-rose-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                type="button"
                                                onClick={() => addFeatureItem(catIdx)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
                                            >
                                                <Plus size={14} /> Add {cat.category} Item
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end gap-4">
                            <button 
                                type="button" 
                                onClick={() => { setIsAdding(false); setEditingPlan(null); setFormData(initialPlan); }}
                                className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                <Save size={20} /> Save Subscription Plan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan._id} className="bg-white rounded-3xl border border-slate-200 p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-2xl">
                                <Package className="text-indigo-600" size={24} />
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => { setEditingPlan(plan); setFormData(plan); setIsAdding(false); }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(plan._id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    plan.type === 'monthly' ? 'bg-blue-100 text-blue-600' :
                                    plan.type === 'quarterly' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                    {plan.type}
                                </span>
                                {plan.badge && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-orange-100 text-orange-600 rounded">
                                        {plan.badge}
                                    </span>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    plan.accessLevel === 'Full' ? 'bg-emerald-600 text-white' :
                                    plan.accessLevel === 'Intermediate' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {plan.accessLevel}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{plan.title}</h3>
                        </div>

                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-2xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
                            {plan.originalPrice && (
                                <span className="text-sm text-slate-400 line-through">₹{plan.originalPrice.toLocaleString()}</span>
                            )}
                        </div>

                        <div className="space-y-2 mb-8">
                            {plan.features[0].items.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <Check className="text-emerald-500" size={14} /> {item}
                                </div>
                            ))}
                            {plan.features[0].items.length > 3 && (
                                <div className="text-[10px] font-bold text-slate-400">+{plan.features[0].items.length - 3} more features</div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Duration: {plan.duration}</span>
                            <span>Order: {plan.order}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionSettings;
