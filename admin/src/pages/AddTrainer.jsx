import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, UserPlus, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddTrainer = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [isCustomRole, setIsCustomRole] = useState(false);

    // Initial State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Trainer',
        specialization: '',
        bio: '',
        access: {
            dashboard: true,
            studentsManagement: true,
            coursesLearning: true,
            finance: false,
            marketingWebsite: false,
            communication: false,
            settings: false
        },
        photo: ''
    });
    const [profileFile, setProfileFile] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            const fetchTrainer = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const res = await axios.get(`${API_URL}/api/admin/trainers/${id}`);
                    const trainer = res.data;
                    setFormData({
                        ...formData,
                        name: trainer.name || '',
                        email: trainer.email || '',
                        phone: trainer.phone || '',
                        role: trainer.role || 'Trainer',
                        specialization: trainer.specialization || '',
                        bio: trainer.bio || '',
                        photo: trainer.photo || '',
                        access: { ...formData.access, ...(trainer.access || {}) }
                    });
                    
                    // Check if role is custom
                    const standardRoles = ['Trainer', 'Sub-Admin']; // We also fetch course roles dynamically
                    setIsCustomRole(!standardRoles.includes(trainer.role) && !trainer.role.includes('Trainer'));
                } catch (err) {
                    console.error('Failed to fetch trainer:', err);
                    toast.error('Failed to load trainer details');
                }
            };
            fetchTrainer();
        }
    }, [id, isEditMode]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${API_URL}/api/courses`);
                setCourses(res.data);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                toast.error('Failed to load courses');
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (e) => {
        if (e.target.name === 'roleSelect') {
            if (e.target.value === 'Custom') {
                setIsCustomRole(true);
                setFormData({ ...formData, role: '' });
            } else {
                setIsCustomRole(false);
                setFormData({ ...formData, role: e.target.value });
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                if (key !== 'access') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            formDataToSend.append('access', JSON.stringify(formData.access));

            if (profileFile) {
                formDataToSend.append('profilePicture', profileFile);
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (isEditMode) {
                await axios.put(`${API_URL}/api/admin/trainers/update/${id}`, formDataToSend, config);
                toast.success('Trainer updated successfully!');
            } else {
                await axios.post(`${API_URL}/api/admin/trainers/register`, formDataToSend, config);
                toast.success('Trainer registered & email sent successfully!');
            }
            
            navigate('/trainers');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error registering trainer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <button onClick={() => navigate('/trainers')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Trainers
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Trainer' : 'Register New Trainer'}</h1>
                        <p className="text-sm text-gray-500">{isEditMode ? 'Update trainer profile details and feature access.' : 'Create an active trainer profile and grant immediate portal access.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">1</span>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    name="roleSelect"
                                    value={isCustomRole ? 'Custom' : formData.role}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="Trainer">Trainer</option>
                                    <option value="Sub-Admin">Sub-Admin</option>
                                    {courses.length > 0 && <optgroup label="Course Specific">
                                        {courses.map(c => (
                                            <option key={c._id} value={`${c.title} Trainer`}>{c.title} Trainer</option>
                                        ))}
                                    </optgroup>}
                                    <option value="Custom">Add Custom Role...</option>
                                </select>
                                {isCustomRole && (
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-3 border-dashed border-indigo-300"
                                        placeholder="Type custom role here"
                                        required
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {(profileFile || formData.photo) && (
                                        <img
                                            src={profileFile ? URL.createObjectURL(profileFile) : formData.photo}
                                            className="w-12 h-12 rounded-full object-cover border"
                                            alt="Preview"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setProfileFile(e.target.files[0])}
                                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Professional Details */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                            Professional Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Advanced Excel" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Professional Summary</label>
                                <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Brief professional background..."></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Access Control */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                            Feature Access / Permissions (Sidebar Tabs)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(formData.access).map(key => {
                                const friendlyLabels = {
                                    dashboard: 'Dashboard',
                                    studentsManagement: 'Students Management',
                                    coursesLearning: 'Courses & Learning',
                                    finance: 'Finance',
                                    marketingWebsite: 'Marketing & Website',
                                    communication: 'Communication',
                                    settings: 'Settings'
                                };
                                return (
                                    <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${formData.access[key] ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.access[key] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                            {formData.access[key] && <Check size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.access[key]}
                                            onChange={() => setFormData({ ...formData, access: { ...formData.access, [key]: !formData.access[key] } })}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{friendlyLabels[key] || key}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    <div className="pt-6 border-t flex justify-end">
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-70 flex items-center gap-2">
                            {loading ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><Save size={20} /> {isEditMode ? 'Update Trainer' : 'Register & Send Invite'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTrainer;
