import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, X, Image, BookOpen, Clock, DollarSign, BarChart, Upload, FileText, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    // Form State
    const initialFormState = {
        title: '',
        description: '',
        overview: '',
        duration: '',
        fee: '',
        skillLevel: 'Beginner',
        image: null,
        syllabusPdf: null,
        syllabusLink: '',
        brochurePdf: null,
        brochureLink: '',
        highlights: [],
        syllabus: [],
        isBonus: false,
        pricingType: 'free',
        priceCoins: 0,
        pricePoints: 0,
        assignedClasses: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [newHighlight, setNewHighlight] = useState('');
    const [newModule, setNewModule] = useState({ title: '', modules: [] }); // modules here is array of strings (topics)
    const [currentTopic, setCurrentTopic] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const coursesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`);
            const classesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/batches`);
            setCourses(coursesRes.data);
            setClasses(classesRes.data.batches || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Failed to load courses & classes');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Subject?',
            text: 'Are you sure you want to delete this subject? This will remove all associated files and modules. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${id}`);
            setCourses(courses.filter(course => course._id !== id));
            
            // Refresh classes to update counts
            const classesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/batches`);
            setClasses(classesRes.data.batches || []);
            
            toast.success('Subject deleted successfully');
        } catch (err) {
            console.error('Error deleting course:', err);
            toast.error('Failed to delete subject');
        }
    };

    const handleOpenModal = (course = null) => {
        if (course) {
            setEditingCourse(course);
            const currentAssigned = classes
                .filter(cls => (cls.courses || []).some(c => (c._id || c) === course._id))
                .map(cls => cls._id);

            setFormData({
                ...initialFormState,
                title: course.title,
                description: course.description,
                overview: course.overview || '',
                duration: course.duration,
                fee: course.fee,
                skillLevel: course.skillLevel,
                isBonus: course.isBonus || false,
                syllabusLink: course.syllabusLink || '',
                brochureLink: course.brochureLink || '',
                highlights: course.highlights || [],
                syllabus: course.syllabus || [],
                pricingType: course.pricingType || 'free',
                priceCoins: course.priceCoins || 0,
                pricePoints: course.pricePoints || 0,
                assignedClasses: currentAssigned
            });
        } else {
            setEditingCourse(null);
            setFormData({
                ...initialFormState,
                assignedClasses: (selectedClassId !== 'all' && selectedClassId !== 'unassigned') ? [selectedClassId] : []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
        setFormData(initialFormState);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (e.target.name === 'image') {
                const maxImageSize = 2 * 1024 * 1024; // 2MB
                if (file.size > maxImageSize) {
                    toast.error("Image file is too large. Maximum size allowed is 2MB.");
                    e.target.value = "";
                    return;
                }
            } else if (e.target.name === 'syllabusPdf' || e.target.name === 'brochurePdf') {
                const maxPdfSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxPdfSize) {
                    toast.error("PDF file is too large. Maximum size allowed is 5MB.");
                    e.target.value = "";
                    return;
                }
            }
            setFormData({ ...formData, [e.target.name]: file });
        }
    };

    // Highlights Helpers
    const addHighlight = () => {
        if (newHighlight.trim()) {
            setFormData({ ...formData, highlights: [...formData.highlights, newHighlight.trim()] });
            setNewHighlight('');
        }
    };
    const removeHighlight = (index) => {
        const updated = formData.highlights.filter((_, i) => i !== index);
        setFormData({ ...formData, highlights: updated });
    };

    // Syllabus Helpers
    const addSyllabusModule = () => {
        if (newModule.title.trim()) {
            setFormData({ ...formData, syllabus: [...formData.syllabus, { ...newModule, modules: [...newModule.modules] }] });
            setNewModule({ title: '', modules: [] });
        }
    };
    const removeSyllabusModule = (index) => {
        const updated = formData.syllabus.filter((_, i) => i !== index);
        setFormData({ ...formData, syllabus: updated });
    };
    const addTopicToModule = () => {
        if (currentTopic.trim()) {
            setNewModule({ ...newModule, modules: [...newModule.modules, currentTopic.trim()] });
            setCurrentTopic('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving subject...');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('overview', formData.overview);
            data.append('duration', formData.duration);
            data.append('fee', formData.fee);
            data.append('skillLevel', formData.skillLevel);
            data.append('isBonus', formData.isBonus);
            data.append('syllabusLink', formData.syllabusLink);
            data.append('brochureLink', formData.brochureLink);
            data.append('highlights', JSON.stringify(formData.highlights));
            data.append('syllabus', JSON.stringify(formData.syllabus));
            data.append('pricingType', formData.pricingType);
            data.append('priceCoins', formData.priceCoins);
            data.append('pricePoints', formData.pricePoints);

            if (formData.image) data.append('image', formData.image);
            if (formData.syllabusPdf) data.append('syllabusPdf', formData.syllabusPdf);
            if (formData.brochurePdf) data.append('brochurePdf', formData.brochurePdf);

            let res;
            if (editingCourse) {
                res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/${editingCourse._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setCourses(courses.map(c => c._id === editingCourse._id ? res.data : c));
            } else {
                res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setCourses([res.data, ...courses]);
            }

            const courseId = res.data._id;
            // Update batches (classes)
            await Promise.all(classes.map(async (cls) => {
                const isChecked = formData.assignedClasses.includes(cls._id);
                const hasCourse = (cls.courses || []).some(c => (c._id || c) === courseId);

                if (isChecked && !hasCourse) {
                    const updatedCourses = [...(cls.courses || []).map(c => c._id || c), courseId];
                    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/batches/${cls._id}`, {
                        name: cls.name,
                        startDate: cls.startDate,
                        endDate: cls.endDate,
                        maxStudents: cls.maxStudents,
                        description: cls.description,
                        status: cls.status,
                        courses: updatedCourses
                    });
                } else if (!isChecked && hasCourse) {
                    const updatedCourses = (cls.courses || []).map(c => c._id || c).filter(id => id !== courseId);
                    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/batches/${cls._id}`, {
                        name: cls.name,
                        startDate: cls.startDate,
                        endDate: cls.endDate,
                        maxStudents: cls.maxStudents,
                        description: cls.description,
                        status: cls.status,
                        courses: updatedCourses
                    });
                }
            }));

            // Sync batches/classes list after changes
            const classesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/batches`);
            setClasses(classesRes.data.batches || []);

            toast.success(editingCourse ? 'Subject updated successfully' : 'Subject created successfully', { id: toastId });
            handleCloseModal();
        } catch (err) {
            console.error('Error saving course:', err);
            toast.error('Failed to save subject', { id: toastId });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading courses & classes...</div>;

    // Filtered courses based on selected class level and search query
    const filteredCourses = courses.filter((course) => {
        // Filter by class
        if (selectedClassId !== 'all') {
            if (selectedClassId === 'unassigned') {
                const assignedCourseIds = new Set(classes.flatMap(cls => (cls.courses || []).map(c => c._id || c)));
                if (assignedCourseIds.has(course._id)) return false;
            } else {
                const selectedClass = classes.find(cls => cls._id === selectedClassId);
                const classCourseIds = new Set((selectedClass?.courses || []).map(c => c._id || c));
                if (!classCourseIds.has(course._id)) return false;
            }
        }
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                course.title?.toLowerCase().includes(query) ||
                course.description?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const getSelectedClassName = () => {
        if (selectedClassId === 'all') return 'All Subjects';
        if (selectedClassId === 'unassigned') return 'Unassigned Subjects';
        const cls = classes.find(c => c._id === selectedClassId);
        return cls ? `${cls.name} Subjects` : 'Subjects';
    };

    return (
        <div className="space-y-6 p-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Course & Subjects Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage classes and their corresponding subjects.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={20} /> Add New Subject
                </button>
            </div>

            {/* Sidebar + Subjects Grid Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Classes Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                                <Layers size={16} className="text-indigo-500" />
                                Classes
                            </h2>
                            <button
                                onClick={() => navigate('/batches')}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                            >
                                Manage
                            </button>
                        </div>
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setSelectedClassId('all')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${selectedClassId === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <span className="truncate">All Subjects</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedClassId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{courses.length}</span>
                            </button>

                            {classes.map((cls) => {
                                const subjectCount = (cls.courses || []).length;
                                return (
                                    <button
                                        key={cls._id}
                                        onClick={() => setSelectedClassId(cls._id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${selectedClassId === cls._id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <span className="truncate">{cls.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedClassId === cls._id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{subjectCount}</span>
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setSelectedClassId('unassigned')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${selectedClassId === 'unassigned' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <span className="truncate">Unassigned Subjects</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedClassId === 'unassigned' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{courses.filter(c => !classes.some(cls => (cls.courses || []).some(cc => (cc._id || cc) === c._id))).length}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Subjects Grid */}
                <div className="flex-grow w-full space-y-4">
                    {/* Search and Filters inside selected view */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <h2 className="font-bold text-gray-800 text-lg">{getSelectedClassName()}</h2>
                        <div className="flex flex-col sm:flex-row gap-3 flex-grow md:max-w-md items-center">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm"
                                />
                            </div>
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                                Showing <strong>{filteredCourses.length}</strong> of {courses.length}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCourses.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No subjects found in this view.</p>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                                    <div className="relative h-48 bg-gray-100">
                                        <img
                                            src={course.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm backdrop-blur-sm">
                                            <button
                                                onClick={() => navigate(`/courses/${course._id}/modules`)}
                                                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                                                title="Manage Content"
                                            >
                                                <Layers size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(course)}
                                                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course._id)}
                                                className="p-1.5 text-gray-600 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2 flex gap-2">
                                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                {course.skillLevel}
                                            </span>
                                            {course.isBonus && (
                                                <span className="bg-purple-600/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                    Bonus
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1" title={course.title}>
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow" title={course.description}>
                                            {course.description}
                                        </p>

                                        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100 mt-auto">
                                            <div className="flex items-center gap-1">
                                                <Clock size={16} className="text-gray-400" />
                                                {course.duration}
                                            </div>
                                            <div className="font-semibold text-indigo-600">
                                                ₹{course.fee}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCourse ? 'Edit Subject' : 'Create New Subject'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Title *</label>
                                    <input
                                        type="text" name="title" value={formData.title} onChange={handleChange} required
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                        placeholder="e.g. Mathematics"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (Card)</label>
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange} required rows="2"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                        placeholder="Brief summary for the card view..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Overview</label>
                                    <textarea
                                        name="overview" value={formData.overview} onChange={handleChange} required rows="5"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                        placeholder="Detailed subject overview, prerequisites, and learning goals..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <input type="text" name="duration" value={formData.duration} onChange={handleChange} required
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" placeholder="e.g. 6 Months" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee (INR)</label>
                                    <input type="text" name="fee" value={formData.fee} onChange={handleChange} required
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" placeholder="e.g. 4500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
                                    <select name="skillLevel" value={formData.skillLevel} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white">
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        id="isBonus"
                                        name="isBonus"
                                        checked={formData.isBonus}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isBonus" className="ml-2 block text-sm text-gray-900 font-medium">
                                        Mark as Bonus Course (Hides from landing page)
                                    </label>
                                </div>

                                {formData.isBonus && (
                                    <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Pricing Model</label>
                                            <select 
                                                name="pricingType" value={formData.pricingType} onChange={handleChange}
                                                className="w-full p-2 border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 bg-white text-sm"
                                            >
                                                <option value="free">Free</option>
                                                <option value="coins_only">Coins Only</option>
                                                <option value="points_only">Points Only</option>
                                                <option value="coins_and_points">Coins & Points</option>
                                            </select>
                                        </div>
                                        {(formData.pricingType === 'coins_only' || formData.pricingType === 'coins_and_points') && (
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Price (Coins)</label>
                                                <input 
                                                    type="number" name="priceCoins" value={formData.priceCoins} onChange={handleChange}
                                                    className="w-full p-2 border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                        )}
                                        {(formData.pricingType === 'points_only' || formData.pricingType === 'coins_and_points') && (
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Price (Points)</label>
                                                <input 
                                                    type="number" name="pricePoints" value={formData.pricePoints} onChange={handleChange}
                                                    className="w-full p-2 border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* File Inputs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Image</label>
                                    <input type="file" name="image" onChange={handleFileChange} accept="image/*"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus PDF File</label>
                                    <input type="file" name="syllabusPdf" onChange={handleFileChange} accept="application/pdf"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-2" />
                                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">OR Syllabus External Link (Google Doc, Drive)</label>
                                    <input type="url" name="syllabusLink" value={formData.syllabusLink} onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" placeholder="https://docs.google.com/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brochure PDF File</label>
                                    <input type="file" name="brochurePdf" onChange={handleFileChange} accept="application/pdf"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-2" />
                                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">OR Brochure External Link (Google Doc, Drive)</label>
                                    <input type="url" name="brochureLink" value={formData.brochureLink} onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" placeholder="https://docs.google.com/..." />
                                </div>
                            </div>

                            {/* Class Assignment Section */}
                            <div className="border-t border-gray-150 pt-6">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Assign to Classes</label>
                                <p className="text-xs text-gray-500 mb-3">Select which class(es) this subject belongs to.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {classes.map((cls) => {
                                        const isChecked = formData.assignedClasses.includes(cls._id);
                                        return (
                                            <label
                                                key={cls._id}
                                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all ${
                                                    isChecked
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const updated = e.target.checked
                                                            ? [...formData.assignedClasses, cls._id]
                                                            : formData.assignedClasses.filter(id => id !== cls._id);
                                                        setFormData({ ...formData, assignedClasses: updated });
                                                    }}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <span className="text-sm truncate">{cls.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Highlights Builder */}
                            <div className="border-t border-gray-150 pt-6">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Key Highlights</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newHighlight}
                                        onChange={(e) => setNewHighlight(e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                                        placeholder="Add a key highlight (e.g. 100+ Hours Live Classes)"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                                    />
                                    <button type="button" onClick={addHighlight} className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {formData.highlights.map((h, i) => (
                                        <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                                            <span>{h}</span>
                                            <button type="button" onClick={() => removeHighlight(i)} className="text-red-400 hover:text-red-600">
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Syllabus Builder */}
                            <div className="border-t border-gray-150 pt-6">
                                <label className="block text-sm font-bold text-gray-800 mb-2">Syllabus Modules</label>

                                <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-4 border border-gray-200">
                                    <input
                                        type="text"
                                        value={newModule.title}
                                        onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                        placeholder="Module Title (e.g. Introduction to Web)"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={currentTopic}
                                            onChange={(e) => setCurrentTopic(e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                            placeholder="Topic (e.g. HTML5 Semantics)"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopicToModule())}
                                        />
                                        <button type="button" onClick={addTopicToModule} className="bg-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-300 text-sm">Add Topic</button>
                                    </div>
                                    {newModule.modules.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newModule.modules.map((m, i) => (
                                                <span key={i} className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600">{m}</span>
                                            ))}
                                        </div>
                                    )}
                                    <button type="button" onClick={addSyllabusModule} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                                        Add Module to Course
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.syllabus.map((mod, i) => (
                                        <div key={i} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-gray-800 text-sm">Module {i + 1}: {mod.title}</h4>
                                                <button type="button" onClick={() => removeSyllabusModule(i)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <ul className="list-disc list-inside text-xs text-gray-600 pl-2">
                                                {mod.modules.map((top, j) => <li key={j}>{top}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200">
                                    {editingCourse ? 'Save Changes' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
