import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, UserPlus, Users, Trash2, RefreshCw, X, Search, Calendar, IndianRupee, CheckCircle2, AlertCircle, Clock, Gift, Check, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Helper: format number as compact Indian currency string
const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

// Fee Summary Cell
const FeeSummaryCell = ({ feeSummary }) => {
    if (!feeSummary) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 px-2.5 py-1 rounded-full">
                No fee set
            </span>
        );
    }

    const { totalFee, paidAmount, pendingAmount, paidInstallments, totalInstallments, overdueInstallments } = feeSummary;
    const paidPct = totalFee > 0 ? Math.min(100, (paidAmount / totalFee) * 100) : 0;
    const isFullyPaid = paidInstallments >= totalInstallments && pendingAmount <= 0;
    const hasOverdue = overdueInstallments > 0;

    return (
        <div className="flex flex-col gap-1.5 min-w-[180px]">
            {/* Amounts Row */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    ₹{fmt(paidAmount)}
                </span>
                {pendingAmount > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${hasOverdue ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'}`}>
                        {hasOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
                        ₹{fmt(pendingAmount)}
                    </span>
                )}
                {isFullyPaid && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Fully Paid ✓
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isFullyPaid ? 'bg-emerald-500' : hasOverdue ? 'bg-red-400' : 'bg-indigo-400'}`}
                        style={{ width: `${paidPct}%` }}
                    />
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {paidInstallments}/{totalInstallments} inst.
                </span>
            </div>

            {/* Total Fee */}
            <p className="text-[10px] text-gray-400">
                Total: ₹{fmt(totalFee)}
                {hasOverdue && (
                    <span className="ml-1.5 text-red-500 font-medium">{overdueInstallments} overdue</span>
                )}
            </p>
        </div>
    );
};

const BatchStudents = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isChangeBatchOpen, setIsChangeBatchOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [search, setSearch] = useState('');
    const [allBatches, setAllBatches] = useState([]);
    const [newBatchId, setNewBatchId] = useState('');
    const [enrollDate, setEnrollDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectedMoveStudents, setSelectedMoveStudents] = useState([]);
    const [saving, setSaving] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [feeStatusFilter, setFeeStatusFilter] = useState('All'); 


    // Bonus Course Logic
    const [isBonusOpen, setIsBonusOpen] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [bonusCourseId, setBonusCourseId] = useState('');
    const [bonusTargetBatchId, setBonusTargetBatchId] = useState('');
    const [bonusTargetBatches, setBonusTargetBatches] = useState([]);
    const [selectedBonusStudents, setSelectedBonusStudents] = useState([]);

    useEffect(() => {
        fetchBatch();
        fetchEnrollments();
        fetchAllStudents();
    }, [batchId]);

    const fetchBatch = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/batches/${batchId}`);
            setBatch(res.data.batch);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/batches/${batchId}/students`);
            setEnrollments(res.data.students);
        } catch (err) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/list`);
            setAllStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBatchesForCourse = async (courseId, setFn) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/batches?courseId=${courseId}`);
            setFn(res.data.batches || []);
        } catch (err) {
            console.error('Failed to load batches', err);
            toast.error(err.response?.data?.message || err.message || 'Could not load available batches');
        }
    };

    const fetchAllCourses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses`);
            setAllCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignStudent = async (e) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) return;
        setSaving(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/batches/${batchId}/assign`, {
                studentIds: selectedStudentIds,
                enrollmentDate: enrollDate
            });
            toast.success(res.data.message || 'Students assigned to batch');
            setIsAssignOpen(false);
            setSelectedStudentIds([]);
            fetchEnrollments();
            fetchBatch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign students');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeBatch = async (e) => {
        e.preventDefault();
        if (!newBatchId) return;
        setSaving(true);
        try {
            const payload = { newBatchId, oldBatchId: batchId };
            if (selectedMoveStudents.length > 0 && !selectedStudent) {
                payload.studentIds = selectedMoveStudents;
            } else if (selectedStudent) {
                payload.studentId = selectedStudent.studentId?._id;
            } else {
                return;
            }

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/batches/student/change-batch`, payload);
            toast.success(res.data.message || 'Student(s) moved to new batch');
            setIsChangeBatchOpen(false);
            setSelectedMoveStudents([]);
            fetchEnrollments();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to move student(s)');
        } finally {
            setSaving(false);
        }
    };

    const handleAssignBonus = async (e) => {
        e.preventDefault();
        if (!bonusCourseId || selectedBonusStudents.length === 0) {
            toast.error('Please select a course and at least one student');
            return;
        }
        setSaving(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/batches/assign-bonus`, {
                courseId: bonusCourseId,
                targetBatchId: bonusTargetBatchId || null,
                studentIds: selectedBonusStudents
            });
            toast.success(`Bonus course gifted to ${selectedBonusStudents.length} students!`);
            setIsBonusOpen(false);
            setBonusCourseId('');
            setBonusTargetBatchId('');
            setSelectedBonusStudents([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to gift bonus course');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        const result = await Swal.fire({
            title: 'Remove Student?',
            text: 'Are you sure you want to remove this student from the batch?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove them'
        });

        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/batches/${batchId}/students/${studentId}`);
            setEnrollments(prev => prev.filter(e => e.studentId?._id !== studentId));
            toast.success('Student removed');
            fetchBatch();
        } catch (err) {
            toast.error('Failed to remove student');
        }
    };

    const toggleStudentStatus = async (studentId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/students/bulk-status`, {
                studentIds: [studentId],
                status: newStatus
            });
            setEnrollments(prev => prev.map(e => {
                if (e.studentId?._id === studentId) {
                    return { ...e, studentId: { ...e.studentId, status: newStatus } };
                }
                return e;
            }));
            toast.success(`Student status changed to ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update student status');
        }
    };

    const toggleBatchStatus = async () => {
        if (enrollments.length === 0) return toast.error('No students in this batch');
        
        const result = await Swal.fire({
            title: 'Change Batch Status',
            text: 'Set status for ALL students in this batch to:',
            icon: 'question',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Active',
            denyButtonText: 'Inactive',
            confirmButtonColor: '#10b981',
            denyButtonColor: '#6b7280'
        });

        if (!result.isConfirmed && !result.isDenied) return;
        
        const newStatus = result.isConfirmed ? 'Active' : 'Inactive';
        const studentIds = enrollments.map(e => e.studentId?._id).filter(Boolean);
        
        setSaving(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/students/bulk-status`, {
                studentIds,
                status: newStatus
            });
            setEnrollments(prev => prev.map(e => ({
                ...e,
                studentId: e.studentId ? { ...e.studentId, status: newStatus } : e.studentId
            })));
            toast.success(`All students set to ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update batch status');
        } finally {
            setSaving(false);
        }
    };

    const openChangeBatch = (enrollment) => {
        setSelectedStudent(enrollment);
        setSelectedMoveStudents([]);
        setNewBatchId('');
        fetchBatchesForCourse('', setAllBatches);
        setIsChangeBatchOpen(true);
    };

    const openBulkChangeBatch = () => {
        if (selectedMoveStudents.length === 0) return toast.error('Select at least one student to move');
        setSelectedStudent(null);
        setNewBatchId('');
        fetchBatchesForCourse('', setAllBatches);
        setIsChangeBatchOpen(true);
    };

    const openBonusModal = () => {
        fetchAllCourses();
        setSelectedBonusStudents(enrollments.map(e => e.studentId?._id).filter(Boolean));
        setIsBonusOpen(true);
    };

    // Filtered students for assignment modal (Exclude if they exist in ANY batch)
    const assignModalFiltered = allStudents.filter(s =>
        (!s.batchNames || s.batchNames.length === 0) &&
        (s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()))
    );

    // Main student list filtering
    const filteredEnrollments = enrollments.filter(e => {
        const s = e.studentId;
        if (!s) return false;

        const matchesSearch =
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase());

        const matchesFeeStatus =
            feeStatusFilter === 'All' ||
            (feeStatusFilter === 'Paid' && e.feeSummary?.paidInstallments >= e.feeSummary?.totalInstallments) ||
            (feeStatusFilter === 'Pending' && e.feeSummary?.pendingAmount > 0 && e.feeSummary?.overdueInstallments === 0) ||
            (feeStatusFilter === 'Overdue' && e.feeSummary?.overdueInstallments > 0);

        return matchesSearch && matchesFeeStatus;
    });

    // Fee totals for batch summary
    const feeStats = enrollments.reduce((acc, e) => {
        if (e.feeSummary) {
            acc.totalFee += e.feeSummary.totalFee || 0;
            acc.totalPaid += e.feeSummary.paidAmount || 0;
            acc.totalPending += e.feeSummary.pendingAmount || 0;
        }
        return acc;
    }, { totalFee: 0, totalPaid: 0, totalPending: 0 });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <button onClick={() => navigate('/batches')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{batch?.name || 'Batch Students'}</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {batch?.courseId?.title} · {enrollments.length} / {batch?.maxStudents} students enrolled
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={toggleBatchStatus}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={18} /> Toggle Batch Status
                    </button>
                    <button
                        onClick={openBonusModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 font-medium transition-colors text-sm"
                    >
                        <Gift size={18} /> Gift Bonus Course
                    </button>
                    <button
                        onClick={() => { setSelectedStudentIds([]); setSearch(''); setIsAssignOpen(true); }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                    >
                        <UserPlus size={18} /> Assign Student
                    </button>
                </div>
            </div>

            {/* Fee Summary Cards */}
            {enrollments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <IndianRupee size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Fees</p>
                            <p className="text-base font-bold text-gray-800">₹{fmt(feeStats.totalFee)}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Collected</p>
                            <p className="text-base font-bold text-emerald-700">₹{fmt(feeStats.totalPaid)}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="text-base font-bold text-amber-700">₹{fmt(feeStats.totalPending)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 mb-6 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search current batch by name or email..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    {selectedMoveStudents.length > 0 && (
                        <button
                            onClick={openBulkChangeBatch}
                            className="mr-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1 shrink-0"
                        >
                            <RefreshCw size={14} /> Move Selected ({selectedMoveStudents.length})
                        </button>
                    )}
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Fee Status:</span>
                    <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                        {['All', 'Paid', 'Pending', 'Overdue'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFeeStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    feeStatusFilter === status
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 ml-auto">
                    Showing <strong>{filteredEnrollments.length}</strong> of {enrollments.length} students
                </div>
            </div>

            {/* Students Table */}
            {enrollments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No students assigned yet</p>
                    <button onClick={() => setIsAssignOpen(true)} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                        Assign First Student
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-indigo-600 rounded"
                                        checked={selectedMoveStudents.length > 0 && selectedMoveStudents.length === filteredEnrollments.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedMoveStudents(filteredEnrollments.map(en => en.studentId?._id).filter(Boolean));
                                            else setSelectedMoveStudents([]);
                                        }}
                                    />
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fees</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm italic">
                                        No students match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredEnrollments.map(enrollment => {
                                const s = enrollment.studentId;
                                if (!s) return null;
                                return (
                                    <tr key={enrollment._id} className={`hover:bg-gray-50 transition-colors ${selectedMoveStudents.includes(s._id) ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-indigo-600 rounded"
                                                checked={selectedMoveStudents.includes(s._id)}
                                                onChange={() => {
                                                    setSelectedMoveStudents(prev => 
                                                        prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                                    );
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {s.profilePicture ? (
                                                    <img src={s.profilePicture} alt={s.name} className="w-9 h-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                        {s.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                                                    <p className="text-xs text-gray-500">{s.courseName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700">{s.email}</p>
                                            <p className="text-xs text-gray-500">{s.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStudentStatus(s._id, s.status)}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer hover:shadow-sm ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {s.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <FeeSummaryCell feeSummary={enrollment.feeSummary} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => openChangeBatch(enrollment)}
                                                    title="Move to another batch"
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                >
                                                    <RefreshCw size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveStudent(s._id)}
                                                    title="Remove from batch"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
            )}

            {/* Assign Student Modal */}
            {isAssignOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Assign Student to Batch</h2>
                            <button onClick={() => setIsAssignOpen(false)}><X size={22} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAssignStudent} className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search students by name or email..."
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div className="overflow-y-auto flex-1 flex flex-col rounded-lg border border-gray-200">
                                {assignModalFiltered.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400 text-sm">No available students found</div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 shrink-0">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudentIds.length > 0 && selectedStudentIds.length === assignModalFiltered.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStudentIds(assignModalFiltered.map(s => s._id));
                                                        } else {
                                                            setSelectedStudentIds([]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 shrink-0">Select All ({assignModalFiltered.length})</span>
                                            </label>
                                            <span className="text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded-md border border-gray-200">
                                                Selected: <span className="font-bold text-indigo-600">{selectedStudentIds.length}</span>
                                            </span>
                                        </div>
                                        <div className="overflow-y-auto divide-y divide-gray-50">
                                            {assignModalFiltered.map(s => (
                                                <label key={s._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedStudentIds.includes(s._id) ? 'bg-indigo-50' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        value={s._id}
                                                        checked={selectedStudentIds.includes(s._id)}
                                                        onChange={() => {
                                                            setSelectedStudentIds(prev =>
                                                                prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                                            );
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-gray-800 truncate">{s.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date (Drip Start Date)</label>
                                <input
                                    type="date"
                                    value={enrollDate}
                                    onChange={e => setEnrollDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Content unlocks start from this date (weekdays only)</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAssignOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={selectedStudentIds.length === 0 || saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                                    {saving ? 'Assigning...' : `Assign (${selectedStudentIds.length})`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Batch Modal */}
            {isChangeBatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Move to Another Batch</h2>
                            <button onClick={() => setIsChangeBatchOpen(false)}><X size={22} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleChangeBatch} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                {selectedStudent 
                                    ? <>Moving <strong>{selectedStudent?.studentId?.name}</strong> to a new batch</>
                                    : <>Moving <strong>{selectedMoveStudents.length} selected student(s)</strong> to a new batch</>
                                }
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Target Batch</label>
                                {allBatches.length === 0 ? (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                                        No other batches found. Please create another batch first from the Batches page.
                                    </div>
                                ) : (
                                    <select
                                        value={newBatchId}
                                        onChange={e => setNewBatchId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    >
                                        <option value="">Choose batch...</option>
                                        {allBatches.map(b => (
                                            <option key={b._id} value={b._id}>
                                                {b.name} {b.courseId?.title ? `(${b.courseId.title})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsChangeBatchOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                                    {saving ? 'Moving...' : 'Move Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Gift Bonus Course Modal */}
            {isBonusOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-purple-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Gift size={22} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Gift Bonus Course</h2>
                            </div>
                            <button onClick={() => setIsBonusOpen(false)}><X size={22} className="text-gray-400" /></button>
                        </div>
                        
                        <form onSubmit={handleAssignBonus} className="p-6 flex flex-col gap-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Step 1: Select Course</label>
                                    <select
                                        value={bonusCourseId}
                                        onChange={(e) => {
                                            setBonusCourseId(e.target.value);
                                            setBonusTargetBatchId('');
                                            if (e.target.value) fetchBatchesForCourse(e.target.value, setBonusTargetBatches);
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 outline-none text-sm bg-white"
                                        required
                                    >
                                        <option value="">Select a course...</option>
                                        {allCourses.filter(c => c._id !== batch?.courseId?._id).map(c => (
                                            <option key={c._id} value={c._id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Step 2: Select Target Batch</label>
                                    <select
                                        value={bonusTargetBatchId}
                                        onChange={(e) => setBonusTargetBatchId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 outline-none text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        disabled={!bonusCourseId}
                                    >
                                        <option value="">{bonusCourseId ? 'Auto-create new batch (Recommended)' : 'Select course first'}</option>
                                        {bonusTargetBatches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name} ({b.studentCount || 0}/{b.maxStudents})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[250px] flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700">Step 3: Select Students ({selectedBonusStudents.length})</label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (selectedBonusStudents.length === enrollments.length) setSelectedBonusStudents([]);
                                            else setSelectedBonusStudents(enrollments.map(e => e.studentId?._id).filter(Boolean));
                                        }}
                                        className="text-xs font-bold text-purple-600 hover:text-purple-700"
                                    >
                                        {selectedBonusStudents.length === enrollments.length ? 'Deselect All' : 'Select All In Batch'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-60">
                                    {enrollments.map(e => {
                                        const s = e.studentId;
                                        const isSelected = selectedBonusStudents.includes(s?._id);
                                        return (
                                            <label 
                                                key={s?._id} 
                                                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-purple-300 bg-white ring-2 ring-purple-100' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                                                    {isSelected && <Check size={14} />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden" 
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        setSelectedBonusStudents(prev => 
                                                            prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                                        );
                                                    }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{s?.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{s?.email}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsBonusOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving || !bonusCourseId || selectedBonusStudents.length === 0} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-100 flex items-center justify-center gap-2 transition-all">
                                    {saving ? 'Processing...' : <><Gift size={18} /> Gift Course</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchStudents;
