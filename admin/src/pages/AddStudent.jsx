import React, { useState, useEffect } from 'react';
import { UserPlus, Save, ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddStudent = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);

    // Initial State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: 'Male',
        dob: '',
        address: '',
        city: '',
        courseName: '',
        courseCategory: '',
        batchTiming: 'Morning',
        startDate: new Date().toISOString().split('T')[0],
        planTier: 'None',
        access: {
            dashboard: true,
            myCourses: true,
            typingPractice: true,
            payments: true,
            settings: true,
            profile: true
        },
        profilePicture: ''
    });
    const [profileFile, setProfileFile] = useState(null);

    // Fetch Student Data if in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchStudent = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const res = await axios.get(`${API_URL}/api/students/${id}`);
                    const student = res.data;

                    // Format date for input
                    const formattedDate = student.startDate ? new Date(student.startDate).toISOString().split('T')[0] : '';
                    const formattedDob = student.dob ? new Date(student.dob).toISOString().split('T')[0] : '';

                    const filteredAccess = {
                        dashboard: student.access?.dashboard !== false,
                        myCourses: student.access?.myCourses !== false,
                        typingPractice: student.access?.typingPractice !== false,
                        payments: student.access?.payments !== false,
                        settings: student.access?.settings !== false,
                        profile: student.access?.profile !== false
                    };

                    setFormData({
                        ...student,
                        startDate: formattedDate,
                        dob: formattedDob,
                        planTier: student.planTier || 'None',
                        access: filteredAccess,
                        profilePicture: student.profilePicture || ''
                    });
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to load student data');
                }
            };
            fetchStudent();
        }
    }, [id, isEditMode]);

    // Fetch Courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${API_URL}/api/courses`);
                const mappedCourses = res.data.map(c => ({
                    name: c.title,
                    category: c.skillLevel || 'General',
                    title: c.title
                }));
                setCourses(mappedCourses);

                // Set default course if creating a new student and we have courses
                if (!isEditMode && mappedCourses.length > 0) {
                    setFormData(prev => {
                        if (prev.courseName === '') {
                            return {
                                ...prev,
                                courseName: mappedCourses[0].name,
                                courseCategory: mappedCourses[0].category
                            };
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                toast.error('Failed to load courses');
            }
        };
        fetchCourses();
    }, [isEditMode]);

    // Handle Course Change & Auto-set Access
    const handleCourseChange = (e) => {
        const selectedCourse = e.target.value;
        const category = courses.find(c => c.name === selectedCourse)?.category || '';

        let newAccess = { ...formData.access };

        // Reset course-specifics
        newAccess.typingPractice = false;
        newAccess.aiMockInterview = false;

        // Apply Logic
        if (selectedCourse === 'Computer Fundamentals') {
            newAccess.myQR = true;
        } else if (selectedCourse === 'Typing') {
            newAccess.typingPractice = true;
        } else if (selectedCourse === 'MS Office') {
            newAccess.typingPractice = true;
            newAccess.aiMockInterview = true;
        } else if (selectedCourse === 'Web Development') {
            newAccess.aiMockInterview = true;
        }

        setFormData({
            ...formData,
            courseName: selectedCourse,
            courseCategory: category,
            access: newAccess
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            
            // Append all non-object fields
            Object.keys(formData).forEach(key => {
                if (key !== 'access') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append access as string
            formDataToSend.append('access', JSON.stringify(formData.access));

            // Append file if selected
            if (profileFile) {
                formDataToSend.append('profilePicture', profileFile);
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (isEditMode) {
                await axios.put(`${API_URL}/api/students/update/${id}`, formDataToSend, config);
                toast.success('Student updated successfully!');
            } else {
                await axios.post(`${API_URL}/api/students/create`, formDataToSend, config);
                toast.success('Student created successfully!');
            }
            navigate('/students');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to process student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <button onClick={() => navigate('/students')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                <ArrowLeft size={18} className="mr-2" /> Back to Students
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Student' : 'Register New Student'}</h1>
                        <p className="text-sm text-gray-500">{isEditMode ? 'Update student details and access rights.' : 'Create a student record and generate login credentials.'}</p>
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
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                <select 
                                    value={formData.gender} 
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })} 
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {(profileFile || formData.profilePicture) && (
                                        <img 
                                            src={profileFile ? URL.createObjectURL(profileFile) : formData.profilePicture} 
                                            className="w-12 h-12 rounded-full object-cover border" 
                                            alt="Preview" 
                                        />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const maxSize = 2 * 1024 * 1024; // 2MB
                                                if (file.size > maxSize) {
                                                    toast.error("Image file is too large. Maximum size allowed is 2MB.");
                                                    e.target.value = "";
                                                    return;
                                                }
                                                setProfileFile(file);
                                            }
                                        }} 
                                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" 
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="col-span-2 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Street Address" />
                                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="City" />
                                </div>
                            </div>
                        </div>
                    </section>

                {/* Course Details */}
                <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">2</span>
                        Course Assignment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                            <select value={formData.courseName} onChange={handleCourseChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                {courses.length === 0 && <option value="">Loading courses...</option>}
                                {courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <input type="text" readOnly value={formData.courseCategory} className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Batch Timing</label>
                            <select value={formData.batchTiming} onChange={e => setFormData({ ...formData, batchTiming: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                <option value="Morning">Morning (8AM - 12PM)</option>
                                <option value="Afternoon">Afternoon (12PM - 4PM)</option>
                                <option value="Evening">Evening (4PM - 8PM)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Type</label>
                            <select value={formData.planTier || 'None'} onChange={e => setFormData({ ...formData, planTier: e.target.value })} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                <option value="None">None</option>
                                <option value="Basic">Basic</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Full">Full</option>
                                <option value="Premium">Premium</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                        </div>
                    </div>
                </section>



                {/* Access Control */}
                <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">3</span>
                        Future Access
                    </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(formData.access).map(key => (
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
                                    <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    <div className="pt-6 border-t flex justify-end">
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-70 flex items-center gap-2">
                            {loading ? 'Processing...' : <><Save size={20} /> {isEditMode ? 'Update Student' : 'Create Student'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudent;
