import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Zap, ArrowRight, Star, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AboutSection = () => {
    // Default Images
    const defaultImage1 = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"; // Office meeting
    const defaultImage2 = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"; // Finance chart

    const [images, setImages] = useState({ img1: defaultImage1, img2: defaultImage2 });

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/banners`);
                const allBanners = res.data;
                const banner6 = allBanners.find(b => b.order === 6 && b.isActive);
                const banner7 = allBanners.find(b => b.order === 7 && b.isActive);

                setImages({
                    img1: banner6 ? banner6.fileUrl : defaultImage1,
                    img2: banner7 ? banner7.fileUrl : defaultImage2
                });
            } catch (err) {
                console.error("Error fetching about images:", err);
            }
        };
        fetchBanners();
    }, []);

    return (
        <section className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3  w-96 h-96 bg-indigo-200 rounded-full blur-[100px] opacity-50" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-accent-200 rounded-full blur-[100px] opacity-50" />

            <div className="max-w-[90%] mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Content Side */}
                    <div className="order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <span className="h-0.5 w-12 bg-indigo-600 rounded-full"></span>
                                <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm">About Smart Aspirants</span>
                            </div>

                            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                Next-Gen <br />
                                <span className="relative inline-block mt-2">
                                    <span className="relative z-10 text-indigo-600">Finance Careers</span>
                                    <span className="absolute bottom-2 left-0 w-full h-3 bg-accent-100 -z-10 bg-opacity-60 skew-x-12"></span>
                                </span>
                            </h2>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                <strong>Smart Aspirants</strong> is a premier training hub dedicated to transforming graduates into industry-ready <strong>Finance & Accounting</strong> professionals. We bridge the gap between academic education and corporate excellence through specialized training in <strong>Corporate Accounting, Investment Banking Operations, Fund Accounting, KYC/AML</strong>.
                            </p>

                            <div className="space-y-6 mb-10">
                                {[
                                    { title: "Expert Mentorship", desc: "Learn from Qualified CAs and Industry Experts.", icon: Users },
                                    { title: "Practical Exposure", desc: "Hands-on training with real-world case studies.", icon: Target },
                                    { title: "Mock Interviews ", desc: "Weekly Mock Interviews & Interview Preparation.", icon: Zap }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (idx * 0.1) }}
                                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 bg-white/50 backdrop-blur-sm"
                                    >
                                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg shrink-0">
                                            <item.icon size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                <Link
                                    to="/about"
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Read Our Story <ArrowRight size={18} />
                                </Link>
                                <div className="flex gap-4">
                                    <a
                                        href="https://www.linkedin.com/company/smart-aspirants"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white rounded-full text-blue-700 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm border border-gray-100"
                                    >
                                        <Linkedin size={20} />
                                    </a>
                                    <a
                                        href="https://www.instagram.com/smartaspirants/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white rounded-full text-pink-600 hover:bg-pink-50 hover:scale-110 transition-all shadow-sm border border-gray-100"
                                    >
                                        <Instagram size={20} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Visual Side */}
                    <div className="order-1 lg:order-2 py-10 lg:py-0">
                        <div className="relative max-w-lg mx-auto lg:max-w-none lg:h-[600px]">

                            {/* Image 1 */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7 }}
                                className="relative w-full h-[400px] lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white lg:absolute lg:right-0 lg:top-10 lg:w-4/5 z-10"
                            >
                                <img
                                    src={images.img1}
                                    alt="Smart Aspirants Training"
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <p className="font-bold text-lg">Excellence in Finance</p>
                                    <p className="text-sm text-gray-200">Processing Future Leaders</p>
                                </div>
                            </motion.div>

                            {/* Image 2 - Floating Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -30, y: 30 }}
                                whileInView={{ opacity: 1, x: 0, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.7 }}
                                className="hidden lg:block absolute left-0 bottom-20 w-64 h-40 rounded-2xl overflow-hidden shadow-xl border-4 border-white z-20 bg-white"
                            >
                                <img
                                    src={images.img2}
                                    alt="Analysis"
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>

                            {/* Experience Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                className="absolute -top-6 right-6 lg:right-10 z-30 bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center justify-center w-28 h-28 border border-gray-50"
                            >
                                <span className="text-4xl font-extrabold text-indigo-600">100%</span>
                                <span className="text-xs font-semibold text-gray-500 text-center leading-tight">Placement<br />Assistance</span>
                            </motion.div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
export default AboutSection;
