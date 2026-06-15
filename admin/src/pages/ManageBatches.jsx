import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, Users, Calendar, BookOpen, X, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const EMPTY_FORM = {
    name: '',
    courses: [],
    startDate: '',
    endDate: '',
    maxStudents: 30,
    description: '',
    status: 'active'
};

const ManageBatches = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [filterCourse, setFilterCourse] = useState('');

    useEffect(() => {
        Promise.all([fetchBatches(), fetchCourses()]);
    }, []);

    const fetchBatches = async (courseId = '') => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/batches${courseId ? `?courseId=${courseId}` : ''}`;
            const res = await axios.get(url);
            setBatches(res.data.batches);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses`);
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const openCreate = () => {
        setEditingBatch(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
    };

    const openEdit = (batch) => {
        setEditingBatch(batch);
        setForm({
            name: batch.name,
            courses: batch.courses ? batch.courses.map(c => c._id || c) : [],
            startDate: batch.startDate?.split('T')[0] || '',
            endDate: batch.endDate?.split('T')[0] || '',
            maxStudents: batch.maxStudents,
            description: batch.description || '',
            status: batch.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingBatch) {
                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/batches/${editingBatch._id}`,
                    form
                );
                setBatches(prev => prev.map(b => b._id === editingBatch._id ? { ...res.data.batch, studentCount: editingBatch.studentCount } : b));
                toast.success('Class updated');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/batches`, form);
                setBatches(prev => [{ ...res.data.batch, studentCount: 0 }, ...prev]);
                toast.success('Class created');
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save class');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (batchId) => {
        const result = await Swal.fire({
            title: 'Delete Class?',
            text: 'Are you sure you want to delete this class? All student assignments will be removed. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/batches/${batchId}`);
            setBatches(prev => prev.filter(b => b._id !== batchId));
            toast.success('Class deleted');
        } catch (err) {
            toast.error('Failed to delete class');
        }
    };

    const handleFilterChange = (val) => {
        setFilterCourse(val);
        setLoading(true);
        fetchBatches(val);
    };

    const statusColor = (status) => {
        if (status === 'active') return 'bg-green-100 text-green-700';
        if (status === 'upcoming') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-600';
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading classes...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Classes</h1>
                    <p className="text-gray-500 mt-1">Create and manage student classes and subjects</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium w-full sm:w-auto justify-center"
                >
                    <Plus size={18} /> New Class
                </button>
            </div>

            {/* Filter by Course */}
            <div className="mb-6">
                <select
                    value={filterCourse}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none text-sm"
                >
                    <option value="">All Courses</option>
                    {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                </select>
            </div>

            {/* Batch Grid */}
            {batches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No classes yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first class to get started</p>
                    <button onClick={openCreate} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                        Create Class
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {batches.map(batch => (
                        <div key={batch._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg truncate">{batch.name}</h3>
                                    <p className="text-sm text-indigo-600 font-medium mt-0.5 truncate" title={batch.courses?.map(c => c.title).join(', ')}>
                                        {batch.courses?.map(c => c.title).join(', ') || '—'}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ml-2 shrink-0 ${statusColor(batch.status)}`}>
                                    {batch.status}
                                </span>
                            </div>

                            {batch.description && (
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{batch.description}</p>
                            )}

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-gray-400" />
                                    <span>{batch.studentCount} / {batch.maxStudents} students</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 ml-1">
                                        <div
                                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${Math.min((batch.studentCount / batch.maxStudents) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/batches/${batch._id}/students`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    <Eye size={15} /> View Students
                                </button>
                                <button
                                    onClick={() => openEdit(batch)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(batch._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingBatch ? 'Edit Class' : 'Create New Class'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. 4th Class"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects (Courses) *</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-lg bg-gray-50">
                                    {courses.map(c => (
                                        <label key={c._id} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-gray-200 hover:border-indigo-300 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.courses.includes(c._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setForm({ ...form, courses: [...form.courses, c._id] });
                                                    } else {
                                                        setForm({ ...form, courses: form.courses.filter(id => id !== c._id) });
                                                    }
                                                }}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 truncate">{c.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.maxStudents}
                                        onChange={e => setForm({ ...form, maxStudents: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows="3"
                                    placeholder="Add any notes about this class..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {editingBatch ? 'Save Changes' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBatches;
