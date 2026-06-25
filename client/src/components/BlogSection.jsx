import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Share2, Bookmark, Clock, User } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const BlogSection = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    const getAuthorName = (author) => {
        const companyTitle = settings?.siteTitle || 'Smart Aspirants';
        const systemAuthors = ['Admin', 'Smart Aspirants Team', 'Smart Aspirants', 'Smart Aspirants Team'];
        if (!author || systemAuthors.includes(author)) {
            return companyTitle;
        }
        return author;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const [blogsRes, settingsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/blogs`),
                    axios.get(`${API_URL}/api/settings`)
                ]);
                setBlogs(blogsRes.data.slice(0, 3));
                setSettings(settingsRes.data);
            } catch (err) {
                console.error('Error fetching blogs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || blogs.length === 0) return null;

    const featured = blogs[0];
    const secondary = blogs[1];
    const tertiary = blogs[2];

    return (
        <section className="py-20 bg-[#F9FAFB] overflow-hidden relative">
            {/* Subtle Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            
            <div className="container mx-auto px-8 md:px-12 lg:px-20 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 relative">
                    {/* Animated Header Specific Blob - Traveling */}
                    <motion.div
                        animate={{
                            x: [-300, 300, -300],
                            y: [-100, 100, -100],
                            opacity: [0.1, 0.25, 0.1]
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-0 left-0 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] pointer-events-none"
                    />

                    <div className="max-w-xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-4"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            Fresh Insights
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight"
                        >
                            Stay <span className="text-indigo-600">Ahead</span> of the curve.
                        </motion.h2>
                    </div>
                    <Link
                        to="/blogs"
                        className="group flex items-center gap-3 bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300"
                    >
                        View All Stories
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[700px]">
                    {/* Big Featured Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="md:col-span-8 group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-white"
                    >
                        <Link to={`/blogs/${featured._id}`} className="block h-full">
                            <div className="relative h-full">
                                <img src={featured.imageUrl || null} alt={featured.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                                <div className="absolute bottom-10 left-10 right-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                            {featured.category}
                                        </span>
                                        <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                                            <span className="flex items-center gap-1"><Heart size={14} className="text-rose-400" /> {featured.likes || 0}</span>
                                            <span className="flex items-center gap-1"><Share2 size={14} className="text-indigo-400" /> {featured.shares || 0}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight max-w-2xl">
                                        {featured.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-white/60 text-sm font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-2">
                                            <User size={14} /> {getAuthorName(featured.author)}
                                        </span>
                                        <span>•</span>
                                        <span>5 MIN READ</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Right column with two smaller cards */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        {/* Secondary Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="flex-1 group relative bg-indigo-600 rounded-[2.5rem] overflow-hidden shadow-xl shadow-indigo-100 flex flex-col p-10 justify-between cursor-pointer"
                        >
                            <Link to={`/blogs/${tertiary?._id}`} className="absolute inset-0 z-0 opacity-40 group-hover:scale-110 transition-transform duration-700">
                                <img src={tertiary?.imageUrl || null} alt={tertiary?.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900 mix-blend-multiply" />
                            </Link>
                            <div className="relative z-10">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl mb-6 inline-block">
                                    {secondary?.category}
                                </span>
                                <h4 className="text-2xl font-black text-white leading-tight mb-4">
                                    {secondary?.title}
                                </h4>
                            </div>
                            <div className="relative z-10 flex items-center justify-between text-white/80 text-xs font-bold uppercase tracking-widest">
                                <span>{getAuthorName(secondary?.author)}</span>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Discovery Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="flex-1 group relative bg-white rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-50 flex flex-col p-10 justify-between items-start"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <Bookmark size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                                    {tertiary?.title || 'Explore the Archive'}
                                </h4>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">
                                    {tertiary?.excerpt || 'Discover deep dives into technology, career growth, and industry secrets.'}
                                </p>
                            </div>
                            <Link to="/blogs" className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                Explore Now <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Cinematic Newsletter Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-16 bg-slate-950 rounded-[3.5rem] p-8 md:p-12 relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl shadow-indigo-100/50"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-90" />

                    <div className="relative z-10">
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">The Weekly Brief.</h3>
                        <p className="text-slate-400 text-lg font-medium mb-12 max-w-xl mx-auto">
                            Deep dives and career insights delivered to your inbox every Thursday.
                        </p>

                        <form className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 max-w-2xl mx-auto shadow-2xl">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="flex-1 bg-transparent px-8 py-5 outline-none text-white font-medium placeholder:text-slate-600 text-lg"
                            />
                            <button className="bg-white text-slate-950 px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-[1.02]">
                                Join
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default BlogSection;
