import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, MapPin, Briefcase, GraduationCap, Camera, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        socials: { linkedin: '', naukri: '' },
        education: [],
        certifications: []
    });
    const [profilePreview, setProfilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('studentUser'));
                if (!storedUser || !storedUser._id) {
                    navigate('/login');
                    return;
                }

                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/${storedUser._id}`);
                setUser(res.data);

                // Initialize Form
                setFormData({
                    headline: res.data.headline || '',
                    bio: res.data.bio || '',
                    socials: res.data.socials || { linkedin: '', naukri: '' },
                    education: res.data.education || [],
                    certifications: res.data.certifications || []
                });
                setProfilePreview(res.data.profilePicture);
            } catch (err) {
                console.error("Error fetching profile:", err);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                toast.error("Image file is too large. Maximum size allowed is 2MB.");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading("Saving changes...");

        try {
            const data = new FormData();
            data.append('headline', formData.headline);
            data.append('bio', formData.bio);
            data.append('socials', JSON.stringify(formData.socials));
            data.append('education', JSON.stringify(formData.education));
            data.append('certifications', JSON.stringify(formData.certifications));

            if (selectedFile) {
                data.append('profilePicture', selectedFile);
            }

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/students/profile/${user._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success("Profile Updated!", { id: toastId });
                // Update Local Storage User details if picture changed
                const storedUser = JSON.parse(localStorage.getItem('studentUser'));
                localStorage.setItem('studentUser', JSON.stringify({
                    ...storedUser,
                    profilePicture: res.data.user.profilePicture,
                    name: res.data.user.name // Ensure name sync
                }));
            }
        } catch (err) {
            console.error("Update failed:", err);
            toast.error("Update failed. Try again.", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-outfit antialiased">
            <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-semibold">
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="bg-white rounded-[2rem] shadow-md border border-slate-200/80 p-8 space-y-8 text-center relative overflow-hidden">
                {/* Visual decorative circles */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50/35 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    
                    {/* Header */}
                    <div className="mb-6 text-center space-y-1">
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Student Profile</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manage your portal representation</p>
                    </div>

                    {/* Profile Picture Uploader */}
                    <div className="relative group mb-6">
                        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-indigo-100/50 transition-transform duration-300 group-hover:scale-[1.02]">
                            {profilePreview ? (
                                <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-5xl font-black">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110"
                        >
                            <Camera size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                    </div>

                    {/* Student Form fields */}
                    <div className="w-full max-w-md space-y-5 text-left">
                        
                        {/* Name Input (Readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <User size={12} /> Student Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={user?.name || ''}
                                    disabled
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold cursor-not-allowed select-none outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                                    Official
                                </span>
                            </div>
                        </div>

                        {/* Email Input (Readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <Mail size={12} /> Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold cursor-not-allowed select-none outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                                    Official
                                </span>
                            </div>
                        </div>

                        {/* Course Name (Readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <GraduationCap size={12} /> Registered Course
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={user?.courseName || ''}
                                    disabled
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold cursor-not-allowed select-none outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                                    Official
                                </span>
                            </div>
                        </div>

                        {/* Headline (Editable) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                                <Briefcase size={12} /> Professional Headline
                            </label>
                            <input
                                name="headline"
                                value={formData.headline}
                                onChange={handleInputChange}
                                placeholder="e.g. Financial Analyst & Accountant"
                                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-700 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold outline-none transition-all placeholder-slate-300 shadow-sm"
                            />
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="w-full max-w-md pt-6 border-t border-slate-100 mt-6 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs md:text-sm shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Profile Changes
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
