import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Globe, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Link as LinkIcon, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        siteTitle: '',
        logoUrl: '',
        contact: { phone: '', whatsapp: '', email: '', address: '' },
        socials: { facebook: '', instagram: '', linkedin: '', youtube: '' },
        hiringRounds: { mcq: true, video: true, assignment: true },
        file: null
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`);
            setFormData(prev => ({
                ...prev,
                ...res.data,
                contact: { ...prev.contact, ...(res.data.contact || {}) },
                socials: { ...prev.socials, ...(res.data.socials || {}) },
                hiringRounds: { ...prev.hiringRounds, ...(res.data.hiringRounds || {}) },
                file: null
            }));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    };

    const handleChange = (e, section) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSwitchChange = (checked, field) => {
        setFormData(prev => ({
            ...prev,
            hiringRounds: { ...prev.hiringRounds, [field]: checked }
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                toast.error("Logo file is too large. Maximum size allowed is 2MB.");
                e.target.value = "";
                return;
            }
            setFormData(prev => ({ ...prev, file: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('siteTitle', formData.siteTitle);
            data.append('contact', JSON.stringify(formData.contact));
            data.append('socials', JSON.stringify(formData.socials));
            // Ensure hiringRounds is stringified properly
            data.append('hiringRounds', JSON.stringify(formData.hiringRounds));

            if (formData.file) {
                data.append('logo', formData.file);
            } else if (formData.logoUrl) {
                data.append('logoUrl', formData.logoUrl);
            }

            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Settings updated successfully!');

            setFormData(prev => ({
                ...prev,
                ...res.data,
                contact: { ...prev.contact, ...(res.data.contact || {}) },
                socials: { ...prev.socials, ...(res.data.socials || {}) },
                hiringRounds: { ...prev.hiringRounds, ...(res.data.hiringRounds || {}) },
                file: null
            }));
        } catch (error) {
            console.error('Error updating settings:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to update settings.';
            toast.error(`Error: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Site Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage public contact details and site configuration.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-indigo-700 disabled:opacity-70 transition-colors"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* General Information */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-indigo-600" /> General Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Title</label>
                            <input
                                type="text"
                                name="siteTitle"
                                value={formData.siteTitle}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Logo</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {formData.logoUrl && (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                        <img src={formData.logoUrl} alt="Site Logo" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: PNG or JPG, max 10MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Contact Information */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Phone size={20} className="text-green-600" /> Contact Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.contact.phone}
                                onChange={(e) => handleChange(e, 'contact')}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="+1 234..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsapp"
                                value={formData.contact.whatsapp}
                                onChange={(e) => handleChange(e, 'contact')}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Without '+' e.g 1234567890"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.contact.email}
                                    onChange={(e) => handleChange(e, 'contact')}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.contact.address}
                                    onChange={(e) => handleChange(e, 'contact')}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <LinkIcon size={20} className="text-blue-600" /> Social Links
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-3 text-blue-600" size={20} />
                                <input
                                    type="text"
                                    name="facebook"
                                    value={formData.socials.facebook}
                                    onChange={(e) => handleChange(e, 'socials')}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Facebook URL"
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <Instagram className="absolute left-3 top-3 text-pink-600" size={20} />
                            <input
                                type="text"
                                name="instagram"
                                value={formData.socials.instagram}
                                onChange={(e) => handleChange(e, 'socials')}
                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Instagram URL"
                            />
                        </div>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-3 text-blue-700" size={20} />
                            <input
                                type="text"
                                name="linkedin"
                                value={formData.socials.linkedin}
                                onChange={(e) => handleChange(e, 'socials')}
                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="LinkedIn URL"
                            />
                        </div>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-3 text-red-600" size={20} />
                            <input
                                type="text"
                                name="youtube"
                                value={formData.socials.youtube}
                                onChange={(e) => handleChange(e, 'socials')}
                                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="YouTube URL"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
