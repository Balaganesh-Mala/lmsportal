import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Plus, ArrowLeft, Trash2, Edit2, ChevronDown, ChevronRight,
    Video, FileText, Save, X, Calendar, Check,
    BookOpen, Upload, ClipboardList, Layers, Lock, LockOpen, ShieldCheck, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ManageCourseModules = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drip lock state
    const [dripEnabled, setDripEnabled] = useState(false); // true if any topic has unlockOrder
    const [dripLoading, setDripLoading] = useState(false);

    // Module Form State
    const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editModuleTitle, setEditModuleTitle] = useState('');

    // Topic State (Map of moduleId -> topics array)
    const [topics, setTopics] = useState({});
    const [expandedModules, setExpandedModules] = useState({});
    const [loadingTopics, setLoadingTopics] = useState({}); // moduleId -> boolean

    // Topic Form State
    const [activeModuleForTopic, setActiveModuleForTopic] = useState(null); // moduleId
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const initialTopicState = {
        title: '',
        description: '',
        duration: '', // minutes
        classDate: '',
        video: null,
        videoUrl: '',
        isUrlMode: false,
        notes: [],
        externalNotes: [], // [{ name, url }]
        requiredTier: 'Basic'
    };
    const [topicForm, setTopicForm] = useState(initialTopicState);
    const [uploading, setUploading] = useState(false);

    // ─── Topic Content Modal State ───
    const [contentModalTopic, setContentModalTopic] = useState(null); // topic object
    const [contentTab, setContentTab] = useState('quiz'); // 'quiz' | 'tasks' | 'assignment'
    const [topicContent, setTopicContent] = useState(null); // loaded from API
    const [contentLoading, setContentLoading] = useState(false);
    // Test bank for MCQ
    const [testBank, setTestBank] = useState([]);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [selectedQuizTier, setSelectedQuizTier] = useState('Basic');
    const [savingMcq, setSavingMcq] = useState(false);
    // New task form
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [newTaskFile, setNewTaskFile] = useState(null);
    const [isTaskUrlMode, setIsTaskUrlMode] = useState(false);
    const [newTaskUrl, setNewTaskUrl] = useState('');
    const [newTaskTier, setNewTaskTier] = useState('Basic');
    const [savingTask, setSavingTask] = useState(false);
    // New assignment form
    const [newAssignment, setNewAssignment] = useState({ title: '' });
    const [newAssignFile, setNewAssignFile] = useState(null);
    const [isAssignUrlMode, setIsAssignUrlMode] = useState(false);
    const [newAssignUrl, setNewAssignUrl] = useState('');
    const [newAssignTier, setNewAssignTier] = useState('Basic');
    const [savingAssign, setSavingAssign] = useState(false);
    
    // Note tier state for Google Doc/PPT attachment
    const [newNoteTier, setNewNoteTier] = useState('Basic');

    useEffect(() => {
        fetchCourseDetails();
        fetchModules();
    }, [courseId]);

    // ─── Fetch test bank for MCQ assignment ───
    const fetchTestBank = async () => {
        if (testBank.length > 0) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/tests?type=mcq`);
            // ManageTests API returns the array directly
            setTestBank(Array.isArray(res.data) ? res.data : (res.data.tests || []));
        } catch (e) { console.error('Test bank fetch failed', e); }
    };

    // ─── Open content modal for a topic ───
    const openContentModal = async (topic) => {
        setContentModalTopic(topic);
        setContentTab('quiz');
        setTopicContent(null);
        setSelectedTestId('');
        setNewTask({ title: '', description: '' });
        setNewTaskFile(null);
        setIsTaskUrlMode(false);
        setNewTaskUrl('');
        setNewAssignment({ title: '' });
        setNewAssignFile(null);
        setIsAssignUrlMode(false);
        setNewAssignUrl('');
        setContentLoading(true);
        fetchTestBank();
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/topic-content/${topic._id}`);
            setTopicContent(res.data.content);
            setSelectedTestId(res.data.content?.mcqTest?.testId?._id || res.data.content?.mcqTest?.testId || '');
        } catch (e) { console.error('Topic content fetch failed', e); }
        finally { setContentLoading(false); }
    };

    // ─── Save / Remove MCQ Link ───
    const handleSaveMcq = async () => {
        if (!selectedTestId) { toast.error('Please select a test'); return; }
        setSavingMcq(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/mcq-tests`, { 
                testId: selectedTestId,
                requiredTier: selectedQuizTier
            });
            setTopicContent(res.data.content);
            setSelectedTestId('');
            setSelectedQuizTier('Basic');
            toast.success('Quiz linked!');
        } catch (e) { toast.error('Failed to link quiz'); }
        finally { setSavingMcq(false); }
    };
    const handleRemoveMcq = async () => {
        setSavingMcq(true);
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/mcqs`);
            setTopicContent(res.data.content);
            setSelectedTestId('');
            toast.success('Quiz removed');
        } catch (e) { toast.error('Failed to remove quiz'); }
        finally { setSavingMcq(false); }
    };
    const handleRemoveMcqTest = async (testIndex) => {
        setSavingMcq(true);
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/mcq-tests/${testIndex}`);
            setTopicContent(res.data.content);
            toast.success('Quiz removed');
        } catch (e) { toast.error('Failed to remove quiz'); }
        finally { setSavingMcq(false); }
    };

    // ─── Add Task ───
    const handleAddTask = async () => {
        if (!newTask.title) { toast.error('Task title is required'); return; }
        setSavingTask(true);
        const formData = new FormData();
        formData.append('title', newTask.title);
        formData.append('description', newTask.description);
        formData.append('requiredTier', newTaskTier);
        if (newTaskFile) formData.append('file', newTaskFile);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/task`, isTaskUrlMode ? { title: newTask.title, description: newTask.description, fileUrl: newTaskUrl, requiredTier: newTaskTier } : formData, {
                headers: { 'Content-Type': isTaskUrlMode ? 'application/json' : 'multipart/form-data' }
            });
            setTopicContent(res.data.content);
            setNewTask({ title: '', description: '' });
            setNewTaskFile(null);
            setNewTaskUrl('');
            setNewTaskTier('Basic');
            setIsTaskUrlMode(false);
            toast.success('Task added!');
        } catch (e) { toast.error('Failed to add task'); }
        finally { setSavingTask(false); }
    };
    const handleDeleteTask = async (taskIndex) => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/task/${taskIndex}`);
            setTopicContent(res.data.content);
            toast.success('Task removed');
        } catch (e) { toast.error('Failed to remove task'); }
    };

    // ─── Add Assignment ───
    const handleAddAssignment = async () => {
        if (!newAssignment.title) { toast.error('Assignment title is required'); return; }
        setSavingAssign(true);
        const formData = new FormData();
        formData.append('title', newAssignment.title);
        formData.append('requiredTier', newAssignTier);
        // The backend `topicContentRoutes.js` expects the field name to be 'questionFile'
        if (newAssignFile) formData.append('questionFile', newAssignFile);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/assignment`, isAssignUrlMode ? { title: newAssignment.title, questionUrl: newAssignUrl, requiredTier: newAssignTier } : formData, {
                headers: { 'Content-Type': isAssignUrlMode ? 'application/json' : 'multipart/form-data' }
            });
            setTopicContent(res.data.content);
            setNewAssignment({ title: '' });
            setNewAssignFile(null);
            setNewAssignUrl('');
            setNewAssignTier('Basic');
            setIsAssignUrlMode(false);
            toast.success('Document added!');
        } catch (e) { toast.error('Failed to add document'); }
        finally { setSavingAssign(false); }
    };
    const handleDeleteAssignment = async (assignmentIndex) => {
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/topic-content/${contentModalTopic._id}/assignment/${assignmentIndex}`);
            setTopicContent(res.data.content);
            toast.success('Document removed');
        } catch (e) { toast.error('Failed to remove document'); }
    };

    const fetchCourseDetails = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`);
            setCourse(res.data);
        } catch (err) {
            console.error('Error fetching course:', err);
            toast.error('Failed to load course details');
        }
    };

    const fetchModules = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/modules/${courseId}`);
            setModules(res.data.modules);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching modules:', err);
            toast.error('Failed to load modules');
            setLoading(false);
        }
    };

    // ─── Drip: check if it's enabled by looking at topics ───
    // We detect drip status when topics load
    const checkDripStatus = (topicsArray) => {
        setDripEnabled(topicsArray.some(t => t.unlockOrder != null));
    };

    // ─── Enable Drip (sequential unlock order) ───
    const handleEnableDrip = async () => {
        const result = await Swal.fire({
            title: 'Enable Drip Lock?',
            text: 'This will lock all topics and release them day by day based on the batch start date. Students will only see upcoming lessons sequentially.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Enable'
        });

        if (!result.isConfirmed) return;
        setDripLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/drip/set-unlock-order/${courseId}`);
            toast.success('Drip lock enabled! Topics will unlock sequentially based on batch schedule.');
            setDripEnabled(true);
            // Refresh all open topics to get updated unlockOrder values
            setTopics({});
            setExpandedModules({});
        } catch (err) {
            console.error(err);
            toast.error('Failed to enable drip lock');
        } finally {
            setDripLoading(false);
        }
    };

    // ─── Disable Drip (clear all unlock orders) ───
    const handleDisableDrip = async () => {
        const result = await Swal.fire({
            title: 'Disable Drip Lock?',
            text: 'Are you sure? All topics will become freely accessible to students immediately.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Disable'
        });

        if (!result.isConfirmed) return;
        setDripLoading(true);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/drip/unlock-order/${courseId}`);
            toast.success('Drip lock disabled — all topics are now freely accessible.');
            setDripEnabled(false);
            // Refresh all open topics
            setTopics({});
            setExpandedModules({});
        } catch (err) {
            console.error(err);
            toast.error('Failed to disable drip lock');
        } finally {
            setDripLoading(false);
        }
    };

    const fetchTopics = async (moduleId) => {
        if (topics[moduleId]) return; // Already loaded

        setLoadingTopics(prev => ({ ...prev, [moduleId]: true }));
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/topics/${moduleId}`);
            setTopics(prev => ({ ...prev, [moduleId]: res.data.topics }));
            checkDripStatus(res.data.topics || []);
        } catch (err) {
            console.error(`Error fetching topics for ${moduleId}:`, err);
            toast.error('Failed to load topics');
        } finally {
            setLoadingTopics(prev => ({ ...prev, [moduleId]: false }));
        }
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => {
            const isExpanded = !prev[moduleId];
            if (isExpanded) {
                fetchTopics(moduleId);
            }
            return { ...prev, [moduleId]: isExpanded };
        });
    };

    // --- Module Handlers ---

    const handleCreateModule = async (e) => {
        e.preventDefault();
        if (!newModuleTitle.trim()) return;

        try {
            const order = modules.length + 1;
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/module/create`, {
                courseId,
                title: newModuleTitle,
                order
            });
            setModules([...modules, res.data.module]);
            setNewModuleTitle('');
            setIsAddModuleOpen(false);
            toast.success('Module created');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create module');
        }
    };

    const handleDeleteModule = async (moduleId) => {
        const result = await Swal.fire({
            title: 'Delete Module?',
            text: 'Are you sure you want to delete this module and ALL its topics? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete everything'
        });

        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/module/${moduleId}`);
            setModules(modules.filter(m => m._id !== moduleId));
            const newTopics = { ...topics };
            delete newTopics[moduleId];
            setTopics(newTopics);
            toast.success('Module deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete module');
        }
    };

    const startEditModule = (module) => {
        setEditingModuleId(module._id);
        setEditModuleTitle(module.title);
    };

    const saveEditModule = async (moduleId) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/module/${moduleId}`, {
                title: editModuleTitle
            });
            setModules(modules.map(m => m._id === moduleId ? res.data.module : m));
            setEditingModuleId(null);
            toast.success('Module updated');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update module');
        }
    };

    // --- Topic Handlers ---

    const openTopicModal = (moduleId, topic = null) => {
        setActiveModuleForTopic(moduleId);
        if (topic) {
            setEditingTopic(topic);
            setTopicForm({
                title: topic.title,
                description: topic.description || '',
                duration: topic.duration || '',
                classDate: topic.classDate ? topic.classDate.split('T')[0] : '',
                video: null,
                videoUrl: topic.videoUrl || '',
                isUrlMode: topic.videoUrl && (topic.videoUrl.includes('youtube') || topic.videoUrl.includes('youtu.be')),
                notes: [],
                externalNotes: [],
                requiredTier: topic.requiredTier || 'Basic'
            });
        } else {
            setEditingTopic(null);
            setTopicForm(initialTopicState);
        }
        setIsTopicModalOpen(true);
    };

    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        const toastId = toast.loading(editingTopic ? 'Updating topic...' : 'Creating topic...');

        try {
            const formData = new FormData();
            formData.append('moduleId', activeModuleForTopic);
            formData.append('title', topicForm.title);
            formData.append('description', topicForm.description);
            formData.append('duration', topicForm.duration || 0);
            formData.append('classDate', topicForm.classDate);
            formData.append('requiredTier', topicForm.requiredTier);

            // Order calculation for new topic
            if (!editingTopic) {
                const currentTopics = topics[activeModuleForTopic] || [];
                formData.append('order', currentTopics.length + 1);
            }

            if (topicForm.isUrlMode && topicForm.videoUrl) {
                formData.append('videoUrl', topicForm.videoUrl);
            } else if (topicForm.video) {
                formData.append('video', topicForm.video);
            }

            if (topicForm.notes && topicForm.notes.length > 0) {
                Array.from(topicForm.notes).forEach((file) => {
                    formData.append('notes', file);
                });
            }

            if (topicForm.externalNotes && topicForm.externalNotes.length > 0) {
                formData.append('externalNotes', JSON.stringify(topicForm.externalNotes));
            }

            let res;
            if (editingTopic) {
                res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/topic/${editingTopic._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Update local state
                setTopics(prev => ({
                    ...prev,
                    [activeModuleForTopic]: prev[activeModuleForTopic].map(t => t._id === editingTopic._id ? res.data.topic : t)
                }));
                toast.success('Topic updated', { id: toastId });
            } else {
                res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/topic/create`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setTopics(prev => ({
                    ...prev,
                    [activeModuleForTopic]: [...(prev[activeModuleForTopic] || []), res.data.topic]
                }));
                toast.success('Topic added', { id: toastId });
            }

            setIsTopicModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save topic', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTopic = async (moduleId, topicId) => {
        const result = await Swal.fire({
            title: 'Delete Topic?',
            text: 'Are you sure you want to delete this topic?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it'
        });

        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/topic/${topicId}`);
            setTopics(prev => ({
                ...prev,
                [moduleId]: prev[moduleId].filter(t => t._id !== topicId)
            }));
            toast.success('Topic deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete topic');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading course content...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/courses')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{course?.title || 'Manage Course Content'}</h1>
                    <p className="text-gray-500">Manage modules, video lessons, and notes.</p>
                </div>
            </div>

            {/* ── Drip Lock Control Banner ── */}
            <div className={`mb-6 flex items-center justify-between p-4 rounded-xl border ${dripEnabled
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                    {dripEnabled
                        ? <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Lock size={18} /></div>
                        : <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><LockOpen size={18} /></div>
                    }
                    <div>
                        <p className="font-semibold text-gray-800 text-sm">
                            {dripEnabled ? 'Drip Lock is ENABLED' : 'Drip Lock is DISABLED'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {dripEnabled
                                ? 'Topics unlock one per working day based on batch start date. Students see 🔒 for locked classes.'
                                : 'All topics are freely accessible. Enable drip to release classes day by day.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    {dripEnabled ? (
                        <button
                            onClick={handleDisableDrip}
                            disabled={dripLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {dripLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LockOpen size={16} />}
                            Disable Drip Lock
                        </button>
                    ) : (
                        <button
                            onClick={handleEnableDrip}
                            disabled={dripLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-amber-100"
                        >
                            {dripLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={16} />}
                            Enable Drip Lock
                        </button>
                    )}
                </div>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
                {modules.map((module) => (
                    <div key={module._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Module Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => toggleModule(module._id)}
                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                    {expandedModules[module._id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>

                                {editingModuleId === module._id ? (
                                    <div className="flex items-center gap-2 flex-1 max-w-md">
                                        <input
                                            type="text"
                                            value={editModuleTitle}
                                            onChange={(e) => setEditModuleTitle(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                            autoFocus
                                        />
                                        <button onClick={() => saveEditModule(module._id)} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => setEditingModuleId(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <h3
                                        className="font-semibold text-gray-800 cursor-pointer select-none"
                                        onClick={() => toggleModule(module._id)}
                                    >
                                        {module.title}
                                    </h3>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    {topics[module._id] ? topics[module._id].length : '?'} Topics
                                </span>
                                <button
                                    onClick={() => startEditModule(module)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteModule(module._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Topics List (Collapsible) */}
                        {expandedModules[module._id] && (
                            <div className="p-4 bg-white">
                                {loadingTopics[module._id] ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Loading topics...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {(topics[module._id] || []).map((topic) => (
                                            <div key={topic._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                        {topic.videoUrl ? <Video size={16} /> : <FileText size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{topic.title}</p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                            <span>{topic.duration} mins</span>
                                                            {topic.classDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} /> {new Date(topic.classDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {topic.unlockOrder != null && (
                                                                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                                                    <Lock size={10} /> Day {topic.unlockOrder}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openContentModal(topic)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors"
                                                        title="Manage MCQ / Tasks / Assignment"
                                                    >
                                                        <Layers size={13} /> Content
                                                    </button>
                                                    <button
                                                        onClick={() => openTopicModal(module._id, topic)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit topic"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTopic(module._id, topic._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete topic"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => openTopicModal(module._id)}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-2"
                                        >
                                            <Plus size={18} /> Add Topic
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Module Button */}
            {!isAddModuleOpen ? (
                <button
                    onClick={() => setIsAddModuleOpen(true)}
                    className="mt-6 w-full py-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={20} /> Add New Module
                </button>
            ) : (
                <form onSubmit={handleCreateModule} className="mt-6 bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Module Title</label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            placeholder="e.g. Advanced React Patterns"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                            autoFocus
                        />
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap">
                            Create Module
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddModuleOpen(false)}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Topic Modal */}
            {isTopicModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                            </h2>
                            <button onClick={() => setIsTopicModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleTopicSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic Title</label>
                                <input
                                    type="text"
                                    value={topicForm.title}
                                    onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                                    <input
                                        type="number"
                                        value={topicForm.duration}
                                        onChange={(e) => setTopicForm({ ...topicForm, duration: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                        placeholder="e.g. 45"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Date</label>
                                    <input
                                        type="date"
                                        value={topicForm.classDate}
                                        onChange={(e) => setTopicForm({ ...topicForm, classDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={topicForm.description}
                                    onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    rows="3"
                                />
                            </div>

                            {/* Video Input: Toggle between File and URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video Source</label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="videoSource"
                                            value="upload"
                                            checked={!topicForm.videoUrl && !topicForm.isUrlMode} // Default to upload logic
                                            onChange={() => setTopicForm({ ...topicForm, isUrlMode: false, videoUrl: '' })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Upload File (MP4)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="videoSource"
                                            value="url"
                                            checked={topicForm.isUrlMode || (topicForm.videoUrl && topicForm.videoUrl.includes('http'))}
                                            onChange={() => setTopicForm({ ...topicForm, isUrlMode: true, video: null })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        YouTube URL
                                    </label>
                                </div>

                                {topicForm.isUrlMode ? (
                                    <input
                                        type="url"
                                        value={topicForm.videoUrl || ''}
                                        onChange={(e) => setTopicForm({ ...topicForm, videoUrl: e.target.value })}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                ) : (
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => setTopicForm({ ...topicForm, video: e.target.files[0] })}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                )}

                                {editingTopic?.videoUrl && !topicForm.video && !topicForm.videoUrl && (
                                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <Check size={12} /> Current video: <a href={editingTopic.videoUrl} target="_blank" rel="noreferrer" className="underline">View</a>
                                    </div>
                                )}
                            </div>

                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <label className="block text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Content Access Tier
                                </label>
                                <select 
                                    value={topicForm.requiredTier}
                                    onChange={(e) => setTopicForm({ ...topicForm, requiredTier: e.target.value })}
                                    className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                                >
                                    <option value="Free Trial">Free Trial</option>
                                    <option value="Basic">Basic (Premium Plan)</option>
                                    <option value="Intermediate">Intermediate (Gold Plan)</option>
                                    <option value="Full">Full (Platinum Plan)</option>
                                </select>
                                <p className="mt-1.5 text-[10px] text-amber-600/70 font-medium">Students with lower tiers won't be able to access this topic.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Notes (PDFs/Images)</label>
                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    multiple
                                    onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.files })}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {editingTopic?.notes?.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Current Notes:</p>
                                        {editingTopic.notes.map((note, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                                <FileText size={12} /> {note.name || `Note ${idx + 1}`}
                                                {/* Delete note logic could go here */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {topicForm.externalNotes?.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-indigo-500 font-medium tracking-wide flex items-center gap-1.5 uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> New Google Docs:
                                        </p>
                                        {topicForm.externalNotes.map((note, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-100 rounded-lg group/note">
                                                <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium truncate">
                                                    <Globe size={13} className="shrink-0" />
                                                    <span className="truncate">{note.name} {note.type === 'google_ppt' ? '(PPT)' : '(Doc)'}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setTopicForm(p => ({ ...p, externalNotes: p.externalNotes.filter((_, i) => i !== idx) }))}
                                                    className="p-1 hover:bg-white rounded text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add External Note Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-tight">
                                    <Globe size={16} className="text-indigo-600" />
                                    Add Google Doc / PPT (Preview Only)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Note Name (e.g. Audit PPT)"
                                        id="extNoteName"
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 outline-none bg-white font-medium"
                                    />
                                    <input
                                        type="url"
                                        placeholder="Google Doc/PPT URL"
                                        id="extNoteUrl"
                                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 outline-none bg-white font-medium"
                                    />
                                </div>
                                <div className="flex gap-4 items-center">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <input type="radio" name="extNoteType" value="google_doc" defaultChecked className="text-indigo-600" />
                                        Google Doc
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <input type="radio" name="extNoteType" value="google_ppt" className="text-indigo-600" />
                                        Google PPT
                                    </label>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-600">Access Tier</label>
                                    <select
                                        value={newNoteTier}
                                        onChange={e => setNewNoteTier(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 outline-none bg-white font-bold text-indigo-700"
                                    >
                                        <option value="Free Trial">Free Trial</option>
                                        <option value="Basic">Basic (Premium Plan)</option>
                                        <option value="Premium">Premium Only</option>
                                        <option value="Gold">Gold Only</option>
                                        <option value="Platinum">Platinum Only</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const name = document.getElementById('extNoteName').value;
                                        const url = document.getElementById('extNoteUrl').value;
                                        const type = document.querySelector('input[name="extNoteType"]:checked')?.value || 'google_doc';
                                        if (!name || !url) return toast.error('Please provide name and URL');
                                        setTopicForm(p => ({ ...p, externalNotes: [...(p.externalNotes || []), { name, url, type, requiredTier: newNoteTier }] }));
                                        document.getElementById('extNoteName').value = '';
                                        document.getElementById('extNoteUrl').value = '';
                                        setNewNoteTier('Basic');
                                    }}
                                    className="w-full py-2 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Attach Document
                                </button>
                                <p className="text-[10px] text-slate-400 text-center font-medium">Documents will be shown as an embedded preview for students</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsTopicModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> {editingTopic ? 'Save Changes' : 'Create Topic'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════ TOPIC CONTENT MODAL ═══════════════ */}
            {contentModalTopic && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setContentModalTopic(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Topic Content</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{contentModalTopic.title}</p>
                            </div>
                            <button onClick={() => setContentModalTopic(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6">
                            {[{ id: 'quiz', label: 'Quiz (MCQ)', icon: BookOpen }, { id: 'tasks', label: 'Tasks', icon: ClipboardList }, { id: 'assignment', label: 'Document / PDF', icon: FileText }].map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setContentTab(id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${contentTab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}>
                                    <Icon size={15} />{label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {contentLoading ? (
                                <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
                            ) : (
                                <>

                                    {/* ── Quiz Tab ── */}
                                    {contentTab === 'quiz' && (
                                        <div className="space-y-5">
                                            <p className="text-sm text-gray-600">Link tests from your test bank as the MCQ quizzes for this topic. Students get one attempt per quiz.</p>

                                            {/* Legacy single quiz if still present */}
                                            {topicContent?.mcqTest?.enabled && topicContent?.mcqTest?.testId && (
                                                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen size={18} className="text-purple-600 font-bold" />
                                                        <div>
                                                            <p className="text-sm font-bold text-purple-800">
                                                                {topicContent.mcqTest.testId?.title || 'Linked Test'} (Legacy)
                                                            </p>
                                                            <p className="text-[10px] text-purple-600 uppercase font-black tracking-widest mt-0.5">Required Tier: Basic</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleRemoveMcq} disabled={savingMcq}
                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                </div>
                                            )}

                                            {/* Current multiple quizzes */}
                                            {topicContent?.mcqTests?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Linked Quizzes</p>
                                                    {topicContent.mcqTests.map((quiz, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <BookOpen size={18} className="text-indigo-600" />
                                                                <div>
                                                                    <p className="text-sm font-semibold text-indigo-900">
                                                                        {quiz.testId?.title || 'Linked Quiz'}
                                                                    </p>
                                                                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                                                                        Required Tier: <span className="text-pink-600 font-black">{quiz.requiredTier || 'Basic'}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleRemoveMcqTest(idx)} disabled={savingMcq}
                                                                className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50">
                                                                <Trash2 size={14} /> Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Link New Quiz</p>
                                                
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-gray-500">Select Quiz</label>
                                                    <select
                                                        value={selectedTestId}
                                                        onChange={e => setSelectedTestId(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none text-sm bg-white font-medium text-slate-800"
                                                    >
                                                        <option value="">-- Choose a test --</option>
                                                        {testBank.filter(t => t.type === 'mcq').map(t => (
                                                            <option key={t._id} value={t._id}>{t.title} ({t.questions?.length || 0} questions)</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-gray-500">Access Tier</label>
                                                    <select
                                                        value={selectedQuizTier}
                                                        onChange={e => setSelectedQuizTier(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none text-sm bg-white font-bold text-indigo-700"
                                                    >
                                                        <option value="Free Trial">Free Trial</option>
                                                        <option value="Basic">Basic (Premium Plan)</option>
                                                        <option value="Premium">Premium Only</option>
                                                        <option value="Gold">Gold Only</option>
                                                        <option value="Platinum">Platinum Only</option>
                                                    </select>
                                                </div>

                                                <button onClick={handleSaveMcq} disabled={savingMcq || !selectedTestId}
                                                    className="w-full mt-2 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                                    {savingMcq ? 'Saving...' : <><Plus size={15} /> Link Quiz</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Tasks Tab ── */}
                                    {contentTab === 'tasks' && (
                                        <div className="space-y-5">
                                            {/* Existing tasks */}
                                            {topicContent?.tasks?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Existing Tasks</p>
                                                    {topicContent.tasks.map((task, idx) => (
                                                        <div key={idx} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-slate-50/50">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                                                                    <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                                                        {task.requiredTier || 'Basic'}
                                                                    </span>
                                                                </div>
                                                                {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                                                                {task.fileUrl && <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block w-fit font-medium">View Resource</a>}
                                                            </div>
                                                            <button onClick={() => handleDeleteTask(idx)} className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add new task */}
                                            <div className="space-y-3 border-t border-gray-100 pt-4">
                                                <p className="text-sm font-bold text-gray-700">Add New Task</p>
                                                <input type="text" placeholder="Task title *" value={newTask.title}
                                                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none font-medium" />
                                                <textarea placeholder="Description (optional)" value={newTask.description}
                                                    onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                                                    rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none font-medium" />
                                                
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-gray-500">Access Tier</label>
                                                    <select
                                                        value={newTaskTier}
                                                        onChange={e => setNewTaskTier(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-bold text-indigo-700 focus:border-indigo-500 outline-none"
                                                    >
                                                        <option value="Free Trial">Free Trial</option>
                                                        <option value="Basic">Basic (Premium Plan)</option>
                                                        <option value="Premium">Premium Only</option>
                                                        <option value="Gold">Gold Only</option>
                                                        <option value="Platinum">Platinum Only</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                            <input type="radio" checked={!isTaskUrlMode} onChange={() => setIsTaskUrlMode(false)} className="text-indigo-600 focus:ring-indigo-500" />
                                                            File Upload
                                                        </label>
                                                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                            <input type="radio" checked={isTaskUrlMode} onChange={() => setIsTaskUrlMode(true)} className="text-indigo-600 focus:ring-indigo-500" />
                                                            Public URL
                                                        </label>
                                                    </div>
                                                    {isTaskUrlMode ? (
                                                        <input type="url" placeholder="https://..." value={newTaskUrl} onChange={e => setNewTaskUrl(e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none font-medium" />
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                                                                <Upload size={14} /> Resource File (optional)
                                                                <input type="file" className="hidden" onChange={e => setNewTaskFile(e.target.files[0])} />
                                                            </label>
                                                            {newTaskFile && <span className="text-xs text-gray-500 truncate max-w-[140px]">{newTaskFile.name}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={handleAddTask} disabled={savingTask}
                                                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                                    {savingTask ? 'Adding...' : <><Plus size={15} /> Add Task</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Document / PDF Tab ── */}
                                    {contentTab === 'assignment' && (
                                        <div className="space-y-5">
                                            {/* Existing documents */}
                                            {topicContent?.assignments?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Existing Documents</p>
                                                    {topicContent.assignments.map((assign, idx) => (
                                                        <div key={idx} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-slate-50/50">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-gray-800">{assign.title}</p>
                                                                    <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                                                        {assign.requiredTier || 'Basic'}
                                                                    </span>
                                                                </div>
                                                                {assign.questionUrl && <a href={assign.questionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block w-fit font-medium">View Document</a>}
                                                            </div>
                                                            <button onClick={() => handleDeleteAssignment(idx)} className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add new document */}
                                            <div className="space-y-3 border-t border-gray-100 pt-4">
                                                <p className="text-sm font-bold text-gray-700">Add New Document</p>
                                                <input type="text" placeholder="Document title *" value={newAssignment.title}
                                                    onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none font-medium" />
                                                
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-gray-500">Access Tier</label>
                                                    <select
                                                        value={newAssignTier}
                                                        onChange={e => setNewAssignTier(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white font-bold text-indigo-700 focus:border-indigo-500 outline-none"
                                                    >
                                                        <option value="Free Trial">Free Trial</option>
                                                        <option value="Basic">Basic (Premium Plan)</option>
                                                        <option value="Premium">Premium Only</option>
                                                        <option value="Gold">Gold Only</option>
                                                        <option value="Platinum">Platinum Only</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                            <input type="radio" checked={!isAssignUrlMode} onChange={() => setIsAssignUrlMode(false)} className="text-indigo-600 focus:ring-indigo-500" />
                                                            File Upload (PDF)
                                                        </label>
                                                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                            <input type="radio" checked={isAssignUrlMode} onChange={() => setIsAssignUrlMode(true)} className="text-indigo-600 focus:ring-indigo-500" />
                                                            Google Drive / Public Link
                                                        </label>
                                                    </div>
                                                    {isAssignUrlMode ? (
                                                        <input type="url" placeholder="https://drive.google.com/..." value={newAssignUrl} onChange={e => setNewAssignUrl(e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none font-medium" />
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                                                                <Upload size={14} /> Choose Document (PDF, Image)
                                                                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setNewAssignFile(e.target.files[0])} />
                                                            </label>
                                                            {newAssignFile && <span className="text-xs text-gray-500 truncate max-w-[140px]">{newAssignFile.name}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={handleAddAssignment} disabled={savingAssign}
                                                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                                    {savingAssign ? 'Adding...' : <><Plus size={15} /> Add Document</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCourseModules;
