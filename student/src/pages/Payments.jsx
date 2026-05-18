import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    IndianRupee, 
    FileText, 
    AlertCircle, 
    CheckCircle2, 
    Clock,
    Search
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

export default function Payments() {
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ paid: 0, pending: 0, total: 0 });
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState(null);

    useEffect(() => {
        const fetchInstallments = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('studentUser'));
                if (!user?._id) return;

                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${apiUrl}/api/finance/installments?student_id=${user._id}`);
                
                const data = res.data;
                setInstallments(data);

                const paid = data.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
                const total = data.reduce((sum, i) => sum + i.amount, 0);
                setStats({ paid, pending: total - paid, total });

            } catch (error) {
                console.error("Failed to fetch payments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstallments();
    }, []);

    const openReceipt = (installment) => {
        setSelectedInstallment(installment);
        setIsReceiptOpen(true);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline gap-4 mb-12 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
                    <p className="text-slate-500 text-sm mt-1">Track your course installments and download receipts.</p>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
                        <p className="text-xl font-bold text-slate-900">₹{stats.paid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
                        <p className="text-xl font-bold text-rose-500">₹{stats.pending.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Simple Search */}
            <div className="mb-8 flex items-center gap-3">
                <div className="relative flex-1 w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search installments..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                    />
                </div>
            </div>

            {/* Flat Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">No.</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="5" className="px-6 py-6"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : installments.length > 0 ? (
                            installments.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <span className="text-sm font-medium text-slate-500">
                                            {item.installment_no === 99 ? (
                                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Subscription</span>
                                            ) : (
                                                `#${item.installment_no}`
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <p className="text-sm text-slate-900 font-medium">
                                            {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        {item.status === 'Paid' ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase">
                                                <CheckCircle2 size={14} /> Paid
                                            </div>
                                        ) : item.status === 'Overdue' ? (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px] uppercase">
                                                <AlertCircle size={14} /> Overdue
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase">
                                                <Clock size={14} /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-bold text-slate-900">
                                            <IndianRupee size={12} className="mr-0.5 text-slate-300" />
                                            {item.amount.toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right whitespace-nowrap">
                                        {item.status === 'Paid' && (
                                            <button 
                                                onClick={() => openReceipt(item)}
                                                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1.5 ml-auto group"
                                            >
                                                <FileText size={14} />
                                                <span>Receipt</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <p className="text-sm text-slate-400">No payment history available.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ReceiptModal 
                isOpen={isReceiptOpen} 
                onClose={() => setIsReceiptOpen(false)} 
                installment={selectedInstallment} 
            />
        </div>
    );
}
