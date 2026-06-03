import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    User,
    IndianRupee,
    Calendar,
    Loader,
    Receipt,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import ReceiptModal from '../components/ReceiptModal';

export default function FeeManagement() {
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTransactions: 0,
        totalCollected: 0
    });

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            // Only fetch paid installments
            const res = await axios.get(`${apiUrl}/api/finance/installments?status=Paid`);
            setInstallments(res.data);

            const uniqueStudents = new Set(res.data.map(i => i.student_id?._id).filter(Boolean));
            const totalCollected = res.data.reduce((sum, inst) => sum + (inst.amount || 0), 0);

            setStats({
                totalStudents: uniqueStudents.size,
                totalTransactions: res.data.length,
                totalCollected: totalCollected
            });

        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch fees details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInstallment = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Record?',
            text: 'Are you sure you want to permanently delete this transaction record? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it'
        });

        if (!result.isConfirmed) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            await axios.delete(`${apiUrl}/api/finance/installments/${id}`);
            toast.success("Transaction record deleted successfully");
            fetchInstallments();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete transaction record');
        }
    };

    const displayData = installments.filter(inst => {
        if (searchTerm && inst.student_id) {
            return inst.student_id.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    const displayTotalAmount = displayData.reduce((sum, inst) => sum + (inst.amount || 0), 0);

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fee Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor and manage Razorpay student subscription payments.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Paid Students</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <IndianRupee size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-emerald-600">₹{stats.totalCollected.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Main List Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
                    <span className="text-sm font-semibold text-gray-700">Recent Transactions</span>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold">Student</th>
                                <th className="px-6 py-4 font-semibold">Payment Date</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Method</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((inst) => (
                                    <tr key={inst._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {inst.student_id?.profilePicture ? (
                                                    <img src={inst.student_id.profilePicture} alt={inst.student_id.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 flex-shrink-0">
                                                        {inst.student_id ? inst.student_id.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{inst.student_id ? inst.student_id.name : 'Unknown Student'}</p>
                                                    <p className="text-xs text-gray-500">{inst.student_id?.email || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{inst.paid_date ? new Date(inst.paid_date).toLocaleDateString() : new Date(inst.due_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-semibold text-emerald-600">
                                                <IndianRupee size={14} />
                                                {inst.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                {inst.payment_mode || 'Razorpay'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedReceipt(inst)}
                                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <Receipt size={14} /> View Receipt
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInstallment(inst._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}

                            {!loading && displayData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No transactions found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {!loading && displayData.length > 0 && (
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 font-bold text-gray-900 text-right">
                                        Total Amount:
                                    </td>
                                    <td colSpan="3" className="px-6 py-4 font-bold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            <IndianRupee size={15} className="text-gray-500" />
                                            {displayTotalAmount.toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

            </div>

            <ReceiptModal
                isOpen={!!selectedReceipt}
                onClose={() => setSelectedReceipt(null)}
                installment={selectedReceipt}
            />

        </div>
    );
}
