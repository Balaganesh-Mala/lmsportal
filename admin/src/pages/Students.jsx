import React, { useState, useEffect, useRef } from 'react';
import {
    UserPlus, Search, Edit2, Trash2, ChevronDown, X,
    AlertCircle, CheckCircle, Clock, Users, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Students = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [subscriptionFilter, setSubscriptionFilter] = useState('All');
    const [courseFilter, setCourseFilter] = useState('All');
    const [batchFilter, setBatchFilter] = useState('All');
    const [allBatches, setAllBatches] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchAllBatches();
    }, []);

    const fetchStudents = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${API_URL}/api/students/list`);
            setStudents(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to load students';
            toast.error(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllBatches = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${API_URL}/api/batches`);
            if (res.data.success) {
                setAllBatches(res.data.batches);
            }
        } catch (err) {
            console.error('Error fetching batches for filter:', err);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Student?',
            text: 'Are you sure you want to delete this student? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            await axios.delete(`${API_URL}/api/students/${id}`);
            toast.success('Student deleted');
            fetchStudents();
        } catch {
            toast.error('Failed to delete student');
        }
    };

    const handleStatusToggle = async (studentId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            await axios.put(`${API_URL}/api/students/update/${studentId}`, { status: newStatus });
            
            // Optimistic update
            setStudents(prev => prev.map(s => 
                s._id === studentId ? { ...s, status: newStatus } : s
            ));
            
            toast.success(`Student marked as ${newStatus}`);
        } catch (err) {
            console.error('Status Toggle Error:', err);
            toast.error('Failed to update status');
        }
    };

    const getFeeStatus = (student) => {
        if (!student.feeDetails) return 'none';
        if (student.feeDetails.overdueInstallments > 0) return 'overdue';
        if (student.feeDetails.pendingAmount > 0) return 'pending';
        if (student.feeDetails.paidAmount > 0) return 'clear'; // Has paid something
        return 'none';
    };

    const filteredStudents = students.filter((s) => {
        const matchSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus = statusFilter === 'All' || 
            (s.status && s.status.trim().toLowerCase() === statusFilter.trim().toLowerCase());
        
        const matchSubscription =
            subscriptionFilter === 'All' ||
            (s.planTier && s.planTier.toLowerCase() === subscriptionFilter.toLowerCase()) ||
            (subscriptionFilter === 'None' && (!s.planTier || s.planTier === 'None'));

        const matchCourse = courseFilter === 'All' || 
            (s.courseName && s.courseName.trim().toLowerCase() === courseFilter.trim().toLowerCase());

        const matchBatch = batchFilter === 'All' || 
            (s.batchNames && s.batchNames.some(bn => bn.trim().toLowerCase() === batchFilter.trim().toLowerCase())) || 
            (s.batchName && s.batchName.trim().toLowerCase() === batchFilter.trim().toLowerCase()) || 
            (s.batchTiming && s.batchTiming.trim().toLowerCase() === batchFilter.trim().toLowerCase());

        return matchSearch && matchStatus && matchSubscription && matchCourse && matchBatch;
    });

    const uniqueCourses = [...new Set(students.map(s => s.courseName).filter(Boolean))].sort();
    
    // Combine official batch names with existing student batch info
    const studentBatchInfo = students.map(s => s.batchName || s.batchTiming).filter(Boolean);
    const officialBatchNames = allBatches.map(b => b.name);
    const uniqueBatches = [...new Set([...officialBatchNames, ...studentBatchInfo])].sort();

    const activeCount = students.filter(s => s.status === 'Active').length;
    const subscribedCount = students.filter(s => s.isSubscribed).length;

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setSubscriptionFilter('All');
        setCourseFilter('All');
        setBatchFilter('All');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'All' || subscriptionFilter !== 'All' || courseFilter !== 'All' || batchFilter !== 'All';

    return (
        <div className="p-4 md:p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {students.length} students &middot; {activeCount} active &middot; {subscribedCount} subscribed
                    </p>
                </div>
                <button
                    onClick={() => navigate('/students/add')}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 self-start sm:self-auto"
                >
                    <UserPlus size={18} /> Add Student
                </button>
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email or course..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${showFilters || hasActiveFilters
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={15} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                                {[statusFilter !== 'All', subscriptionFilter !== 'All', !!searchTerm, courseFilter !== 'All', batchFilter !== 'All'].filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Clear all filters"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</label>
                            <div className="flex gap-1">
                                {['All', 'Active', 'Inactive'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setStatusFilter(opt)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

                        {/* Subscription Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Subscription</label>
                            <div className="flex gap-1 flex-wrap">
                                {['All', 'Basic', 'Intermediate', 'Full', 'Premium', 'Platinum', 'None'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setSubscriptionFilter(opt)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${subscriptionFilter === opt
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-5 bg-gray-200 hidden lg:block" />

                        {/* Course Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Course</label>
                            <select
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="All">All Courses</option>
                                {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="w-px h-5 bg-gray-200 hidden lg:block" />

                        {/* Batch Name Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Batch Name</label>
                            <select
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="All">All Batches</option>
                                {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Results count */}
                <div className="px-4 py-2 text-xs text-gray-500 bg-white border-b border-gray-100">
                    Showing <span className="font-semibold text-gray-700">{filteredStudents.length}</span> of {students.length} students
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 font-semibold">Student</th>
                                <th className="px-4 py-3 font-semibold">Course & Batch</th>
                                <th className="px-4 py-3 font-semibold">Subscription</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm">Loading students...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Users size={32} strokeWidth={1.5} />
                                            <p className="text-sm font-medium">No students match your filters</p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-xs text-indigo-600 hover:underline mt-1"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => {
                                    return (
                                        <tr
                                            key={student._id}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            {/* Student Name & Email */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {student.profilePicture ? (
                                                        <img 
                                                            src={student.profilePicture} 
                                                            alt={student.name} 
                                                            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 flex-shrink-0">
                                                            {student.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{student.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course & Batch */}
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm font-medium text-gray-800 leading-tight">
                                                    {student.courseName || <span className="text-gray-400 italic">No course</span>}
                                                </p>
                                                <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                                    {student.batchName || student.batchTiming || '—'}
                                                </p>
                                                {student.startDate && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                                                        From {new Date(student.startDate).toLocaleDateString('en-GB')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Subscription */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                    student.planTier === 'Premium' || student.planTier === 'Platinum'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : student.planTier === 'Full'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : student.planTier === 'Intermediate'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : student.planTier === 'Basic'
                                                                    ? 'bg-indigo-100 text-indigo-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {student.planTier || 'None'}
                                                </span>
                                            </td>

                                            {/* Status Toggle */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1.5 focus:outline-none">
                                                    <button
                                                        onClick={() => handleStatusToggle(student._id, student.status)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                                            student.status === 'Active' ? 'bg-indigo-600' : 'bg-gray-200'
                                                        }`}
                                                        title={`Change to ${student.status === 'Active' ? 'Inactive' : 'Active'}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                student.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                        student.status === 'Active' ? 'text-indigo-600' : 'text-gray-400'
                                                    }`}>
                                                        {student.status || 'Active'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/students/edit/${student._id}`)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student._id)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Students;
