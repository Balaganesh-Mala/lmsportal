import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Copy, ExternalLink, Shield, Upload, X, Check, Search, 
    Edit2, Image as ImageIcon, PlusCircle, Plus, Trash2, FileText, Video, 
    Link as LinkIcon, Globe, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const StudyMaterialsManagement = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        contentType: 'document',
        targetType: 'global',
        targetBatches: [],
        targetStudents: [],
        file: null,
        thumbnail: null,
        linkUrl: '',
        videoUrl: '',
        isProtected: true,
        requiredTier: 'Basic'
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const adminToken = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${adminToken}` } };

            const [matRes, batchRes, stdRes] = await Promise.all([
                axios.get(`${API_URL}/api/study-materials`, config),
                axios.get(`${API_URL}/api/batches`, config),
                axios.get(`${API_URL}/api/students/list`, config)
            ]);

            setMaterials(matRes.data.data || []);
            setBatches(batchRes.data.batches || []);
            setStudents(stdRes.data || []);
        } catch (error) {
            console.error("Error fetching materials:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleThumbnailChange = (e) => {
        setFormData({ ...formData, thumbnail: e.target.files[0] });
    };

    const handleEdit = (item) => {
        setEditMode(true);
        setEditingId(item._id);
        setFormData({
            title: item.title,
            description: item.description || '',
            contentType: item.contentType,
            targetType: item.targetType,
            targetBatches: item.targetBatches?.map(b => b._id || b) || [],
            targetStudents: item.targetStudents?.map(s => s._id || s) || [],
            file: null,
            thumbnail: null,
            linkUrl: item.linkUrl || '',
            videoUrl: item.videoUrl || '',
            isProtected: item.isProtected,
            requiredTier: item.requiredTier || 'Basic'
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            contentType: 'document',
            targetType: 'global',
            targetBatches: [],
            targetStudents: [],
            file: null,
            thumbnail: null,
            linkUrl: '',
            videoUrl: '',
            isProtected: true,
            requiredTier: 'Basic'
        });
        setEditMode(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) return toast.error("Title is required");
        if (!editMode && formData.contentType === 'document' && !formData.file && !formData.linkUrl) {
            return toast.error("Please upload a file or provide a Drive link");
        }

        setSubmitting(true);
        const loadingToast = toast.loading(editMode ? "Updating study material..." : "Creating study material...");

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const adminToken = localStorage.getItem('adminToken');

            // We use FormData for both create and update since we have potential file uploads
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('description', formData.description);
            payload.append('contentType', formData.contentType);
            payload.append('targetType', formData.targetType);
            payload.append('isProtected', formData.isProtected);
            payload.append('requiredTier', formData.requiredTier);

            if (formData.file) payload.append('file', formData.file);
            if (formData.thumbnail) payload.append('thumbnail', formData.thumbnail);

            if (formData.contentType === 'video') payload.append('videoUrl', formData.videoUrl);
            if (formData.contentType === 'link' || (formData.contentType === 'document' && formData.linkUrl)) {
                payload.append('linkUrl', formData.linkUrl);
            }

            if (formData.targetType === 'batch') {
                formData.targetBatches.forEach(id => payload.append('targetBatches[]', id));
            }
            if (formData.targetType === 'individual') {
                formData.targetStudents.forEach(id => payload.append('targetStudents[]', id));
            }

            const headers = {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${adminToken}`
            };

            const url = editMode
                ? `${API_URL}/api/study-materials/${editingId}`
                : `${API_URL}/api/study-materials`;

            const res = await axios({
                method: editMode ? 'put' : 'post',
                url,
                data: payload,
                headers
            });

            if (res.data.success) {
                toast.success(editMode ? "Material updated successfully" : "Material created successfully", { id: loadingToast });
                setShowModal(false);
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error("Error submitting material:", error);
            toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} material`, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMaterial = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Material?',
            text: "This will remove the material from all assigned students.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const adminToken = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${adminToken}` } };
                await axios.delete(`${API_URL}/api/study-materials/${id}`, config);
                toast.success("Material deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete material");
            }
        }
    };

    const toggleBatchSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            targetBatches: prev.targetBatches.includes(id)
                ? prev.targetBatches.filter(bid => bid !== id)
                : [...prev.targetBatches, id]
        }));
    };

    const toggleStudentSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            targetStudents: prev.targetStudents.includes(id)
                ? prev.targetStudents.filter(sid => sid !== id)
                : [...prev.targetStudents, id]
        }));
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || m.contentType === typeFilter.toLowerCase();
        return matchesSearch && matchesType;
    });

    const searchedStudents = students.filter(s =>
        (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase())) &&
        !formData.targetStudents.includes(s._id)
    ).slice(0, 5);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Materials Management...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Study Materials</h1>
                        <p className="text-slate-500 font-medium">Manage and assign protected documents and videos</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
                    >
                        <PlusCircle size={20} />
                        Add New Material
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                        {['All', 'Document', 'Video', 'Link'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${typeFilter === type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Materials List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredMaterials.map((item) => (
                            <motion.div
                                key={item._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white overflow-hidden rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all flex flex-col h-full"
                            >
                                {/* Thumbnail Header */}
                                <div className="h-40 bg-slate-100 relative overflow-hidden group">
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={48} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl shadow-lg backdrop-blur-md ${item.contentType === 'video' ? 'bg-red-500/90 text-white' :
                                                item.contentType === 'document' ? 'bg-blue-500/90 text-white' :
                                                    'bg-emerald-500/90 text-white'
                                            }`}>
                                            {item.contentType === 'video' ? <Video size={18} /> :
                                                item.contentType === 'document' ? <FileText size={18} /> :
                                                    <LinkIcon size={18} />}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2.5 bg-white/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 rounded-xl shadow-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMaterial(item._id)}
                                                className="p-2.5 bg-white/90 backdrop-blur-md text-slate-400 hover:text-red-500 rounded-xl shadow-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {item.isProtected && (
                                        <div className="absolute bottom-4 left-4 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                            <Shield size={10} /> Protected
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8 font-medium">{item.description || 'No description provided.'}</p>

                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest ${item.targetType === 'global' ? 'bg-indigo-50 text-indigo-600' :
                                                item.targetType === 'batch' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-purple-50 text-purple-600'
                                            }`}>
                                            {item.targetType}
                                        </span>
                                        {item.targetType === 'batch' && <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold">{item.targetBatches?.length} Batches</span>}
                                        {item.targetType === 'individual' && <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold">{item.targetStudents?.length} Students</span>}
                                    </div>

                                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Uploaded {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            <button className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-all"><Copy size={16} /></button>
                                            <a href={item.contentType === 'file' ? item.fileUrl : (item.linkUrl || item.videoUrl)} target="_blank" rel="noreferrer" className="text-slate-400 p-2 hover:bg-slate-100 rounded-xl transition-all"><ExternalLink size={16} /></a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Clean & Minimalist Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
                        >
                            {/* Simple Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">{editMode ? 'Update Study Material' : 'Add Study Material'}</h2>
                                    <p className="text-slate-500 text-xs font-medium">{editMode ? 'Modify existing educational resource' : 'Upload or link protected educational content'}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                                {/* Material Content Selection */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Material Content</label>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        {[
                                            { id: 'document', icon: FileText, label: 'Document' },
                                            { id: 'video', icon: Video, label: 'Video' },
                                            { id: 'link', icon: LinkIcon, label: 'Link' }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, contentType: type.id })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${formData.contentType === type.id
                                                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                <type.icon size={14} />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Advanced Financial Reporting"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                        <textarea
                                            rows="2"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief overview..."
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Digital Protection - Simple Row */}
                                <div className="p-4 bg-orange-50/20 rounded-xl border border-orange-100/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Shield size={16} className="text-orange-600" />
                                        <div className="text-left">
                                            <span className="block text-xs font-bold text-slate-800 leading-none">Digital Protection</span>
                                            <span className="text-[10px] text-slate-500 mt-1 block">Disable copy, print, & download</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isProtected: !formData.isProtected })}
                                        className={`w-10 h-5.5 rounded-full transition-all flex items-center px-1 ${formData.isProtected ? 'bg-orange-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all transform ${formData.isProtected ? 'translate-x-4.5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Access Tier Selection */}
                                <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Layers size={16} className="text-indigo-600" />
                                        <div className="text-left">
                                            <span className="block text-xs font-bold text-slate-800 leading-none">Access Tier</span>
                                            <span className="text-[10px] text-slate-500 mt-1 block">Tier required for students</span>
                                        </div>
                                    </div>
                                    <select 
                                        value={formData.requiredTier}
                                        onChange={(e) => setFormData({ ...formData, requiredTier: e.target.value })}
                                        className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-900 focus:outline-none"
                                    >
                                        <option value="Basic">Basic</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Full">Full</option>
                                    </select>
                                </div>

                                {/* Dynamic Input Area */}
                                <div className="pt-2">
                                    {/* Thumbnail Upload */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Resource Thumbnail</label>
                                        <div className="relative group p-4 border-2 border-dashed border-slate-100 rounded-2xl hover:border-orange-200 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[100px]">
                                            <input type="file" onChange={handleThumbnailChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            {formData.thumbnail ? (
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{formData.thumbnail.name}</p>
                                                        <p className="text-[9px] text-slate-400">Ready to upload</p>
                                                    </div>
                                                    <X onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, thumbnail: null }); }} size={16} className="text-slate-300 hover:text-red-500" />
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload size={18} className="text-slate-300 mb-1 group-hover:text-orange-500 transition-colors" />
                                                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">Cover Image (Optional)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {formData.contentType === 'document' && (
                                        <div className="space-y-4">
                                            <div className="relative group p-6 border-2 border-dashed border-slate-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all text-center cursor-pointer">
                                                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <Upload size={20} className="mx-auto text-slate-300 mb-2 group-hover:text-orange-600 transition-colors" />
                                                <p className="text-xs font-bold text-slate-700">{formData.file ? formData.file.name : (editMode ? 'Upload new file (optional)' : 'Click to Upload Document')}</p>
                                            </div>
                                            <div className="relative text-center">
                                                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100"></div>
                                                <span className="relative bg-white px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">OR PRIVATE LINK</span>
                                            </div>
                                            <input
                                                type="url"
                                                value={formData.linkUrl}
                                                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                                placeholder="Paste private preview link..."
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                    {formData.contentType === 'video' && (
                                        <input
                                            type="url"
                                            value={formData.videoUrl}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            required
                                        />
                                    )}
                                    {formData.contentType === 'link' && (
                                        <input
                                            type="url"
                                            value={formData.linkUrl}
                                            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                            placeholder="https://example.com/article"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            required
                                        />
                                    )}
                                </div>

                                {/* Assign Audience - Horizontal Toggle */}
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Assign Audience</label>
                                        <span className="text-[10px] font-bold text-orange-600 px-2 py-0.5 bg-orange-50 rounded-full capitalize">{formData.targetType}</span>
                                    </div>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        {[
                                            { id: 'global', icon: Globe, label: 'Global' },
                                            { id: 'batch', icon: LayoutGrid, label: 'Batch' },
                                            { id: 'individual', icon: Search, label: 'Individual' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, targetType: t.id })}
                                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${formData.targetType === t.id
                                                        ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                <t.icon size={12} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Nested Selectors */}
                                    <div className="min-h-[120px]">
                                        {formData.targetType === 'batch' && (
                                            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                {batches.map(batch => (
                                                    <div
                                                        key={batch._id}
                                                        onClick={() => toggleBatchSelection(batch._id)}
                                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${formData.targetBatches.includes(batch._id)
                                                                ? 'bg-orange-50 border-orange-200'
                                                                : 'bg-white border-slate-100'
                                                            }`}
                                                    >
                                                        <span className={`text-[11px] font-bold ${formData.targetBatches.includes(batch._id) ? 'text-orange-700' : 'text-slate-600'}`}>{batch.name}</span>
                                                        {formData.targetBatches.includes(batch._id) ? <Check size={14} className="text-orange-600" /> : <Plus size={14} className="text-slate-300" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {formData.targetType === 'individual' && (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search students..."
                                                        value={studentSearch}
                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white transition-all outline-none"
                                                    />
                                                    {studentSearch && searchedStudents.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-[100] max-h-[160px] overflow-y-auto overflow-x-hidden">
                                                            {searchedStudents.map(s => (
                                                                <div
                                                                    key={s._id}
                                                                    onClick={() => { toggleStudentSelection(s._id); setStudentSearch(''); }}
                                                                    className="p-3 hover:bg-orange-50 cursor-pointer flex items-center justify-between text-xs border-b border-slate-50 last:border-0 group"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{s.name}</span>
                                                                        <span className="text-[10px] text-slate-400 group-hover:text-orange-400">{s.email}</span>
                                                                    </div>
                                                                    <Plus size={14} className="text-slate-300 group-hover:text-orange-600" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.targetStudents.map(id => {
                                                        const s = students.find(std => std._id === id);
                                                        return (
                                                            <div key={id} className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 pl-2 pr-1 py-1 rounded-md text-[10px] font-bold border border-orange-200">
                                                                {s?.name || 'Student'}
                                                                <X onClick={() => toggleStudentSelection(id)} size={10} className="cursor-pointer hover:bg-orange-200 rounded p-0.5" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>

                            {/* Simple Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-[2] py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-100 disabled:opacity-50"
                                >
                                    {submitting ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Material' : 'Publish Material')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Helper components
const ArrowRight = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default StudyMaterialsManagement;
