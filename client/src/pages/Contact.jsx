import React, { useState } from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Loader } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Contact = () => {
    const { getContactInfo } = useSettings();

    // Dynamic Data from Settings
    const address = getContactInfo('address') || '123 Skills Ave, Tech City, State';
    const phone = getContactInfo('phone') || '+1 (555) 123-4567';
    const email = getContactInfo('email') || 'info@smartaspirants.com';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inquiries`, {
                ...formData,
                courseInterested: formData.subject, // Map subject to courseInterested or keep distinct if model allows
                source: 'contact_form'
            });
            toast.success('Thank you for contacting us! We will get back to you soon.');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err) {
            console.error('Error submitting contact form:', err);
            setError('Failed to send message. Please try again.');
            toast.error('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#F9FAFB] min-h-screen relative overflow-hidden text-slate-900">
            <SEO
                title="Contact Us"
                description="Get in touch with Smart Aspirants. We are here to answer your queries about professional finance courses, fees, and career guidance."
            />
            {/* Cinematic Header Section */}
            <div className="pt-36 pb-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-b border-white/5 relative overflow-hidden shadow-2xl">
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
                
                {/* Animated Header Specific Blobs - Traveling Effect */}
                <motion.div 
                    animate={{ 
                        x: [-200, 800, -200],
                        y: [-200, 200, -200],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ 
                        duration: 25, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[140px] pointer-events-none" 
                />
                <motion.div 
                    animate={{ 
                        x: [800, -200, 800],
                        y: [200, -200, 200],
                        opacity: [0.1, 0.25, 0.1]
                    }}
                    transition={{ 
                        duration: 30, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] pointer-events-none" 
                />
    
                <div className="container mx-auto px-8 md:px-12 lg:px-20 relative z-10 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-indigo-300 text-xs font-black uppercase tracking-widest relative z-10 shadow-xl mx-auto"
                    >
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        Support
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight relative z-10"
                    >
                        Get in Touch
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-3xl mx-auto font-medium relative z-10"
                    >
                        Have questions about our courses or career guidance? We're here to help you start your journey.
                    </motion.p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Cards */}
                    <div className="space-y-6 lg:col-span-1">

                        {/* Address */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4"
                        >
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Visit Us</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {address}
                                </p>
                            </div>
                        </motion.div>

                        {/* Email */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                        >
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                                <p className="text-gray-600 text-sm">{email}</p>
                            </div>
                        </motion.div>

                        {/* Phone */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                        >
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                                <p className="text-gray-600 text-sm">{phone}</p>
                            </div>
                        </motion.div>

                        {/* Map Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 h-64 overflow-hidden relative"
                        >
                            <iframe
                                    src={import.meta.env.VITE_MAP_EMBED_URL || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153169!3d-37.81720997975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d33d9cbb2815!2sFederation%20Square!5e0!3m2!1sen!2sin!4v1642151234567!5m2!1sen!2sin"}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Our Location"
                                className="rounded-xl"
                            ></iframe>
                        </motion.div>

                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        placeholder="Course Inquiry"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="5"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                                        placeholder="Tell us what you're looking for..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:bg-indigo-400"
                                >
                                    {loading ? 'Sending...' : <>Send Message <Send size={18} /></>}
                                </button>
                            </form>
                        </motion.div>
                    </div>

                </div>



            </div>
        </div>
    );
};

export default Contact;
