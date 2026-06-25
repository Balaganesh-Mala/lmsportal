import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const LocationSection = () => {
    const { getContactInfo } = useSettings();

    const address = getContactInfo('address') || '123 Tech Park Avenue, Main IT Corridor, Silicon Valley, CA 94025';
    const email = getContactInfo('email') || 'hello@smartaspirants.com';
    const phone = getContactInfo('phone') || '+1 (555) 123-4567';

    return (
        <section className="py-24 relative overflow-hidden bg-white">

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#FF7F50] rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.03]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.03]"></div>
            </div>

            <div className="container mx-auto px-6 md:px-12 relative z-10">

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-sm font-bold tracking-widest text-primary-600 uppercase mb-3">
                            Connect With Us
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                            Visit Our <span className="text-primary-600">Campus</span>
                        </h3>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Experience our state-of-the-art learning environment. Whether you're coming for a class or a consultation, we're ready to welcome you.
                        </p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* Contact Info Cards - Spanning 4 cols */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-4 space-y-6"
                    >
                        {/* Address Card */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 hover:border-primary-600/20 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center shrink-0 text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                                <MapPin size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">Headquarters</h4>
                            <p className="text-gray-500 leading-relaxed mb-4">
                                {address}
                            </p>
                            <a href={(import.meta.env.VITE_MAP_URL)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-600 font-semibold text-sm hover:gap-2 transition-all">
                                Get Directions <ArrowRight size={16} className="ml-1" />
                            </a>
                        </div>

                        {/* Contact Channels */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 text-gray-600 shadow-sm">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-900">Email Us</h5>
                                        <p className="text-gray-500 text-sm">{email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 text-gray-600 shadow-sm">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-900">Call Us</h5>
                                        <p className="text-gray-500 text-sm">{phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 text-gray-600 shadow-sm">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-900">Working Hours</h5>
                                        <p className="text-gray-500 text-sm">Mon-Fri: 9AM - 6PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>

                    {/* Map - Spanning 8 cols */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-8 h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100 border border-gray-200 relative group"
                    >
                        <iframe
                            src={import.meta.env.VITE_MAP_EMBED_URL || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153169!3d-37.81720997975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d33d9cbb2815!2sFederation%20Square!5e0!3m2!1sen!2sin!4v1642151234567!5m2!1sen!2sin"}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Smart Aspirants Campus Location"
                            className="transition-all duration-700 ease-in-out"
                        ></iframe>

                        {/* Interactive overlay tip */}
                        <a
                            href={import.meta.env.VITE_MAP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-transparent flex items-center justify-center group-hover:bg-black/5 transition-colors duration-300"
                        >
                            <span className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0 flex items-center gap-2">
                                <MapPin size={16} className="text-[#FF7F50]" />
                                Open on Google Maps
                            </span>
                        </a>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default LocationSection;
