import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, TriangleAlert, Telescope } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="text-center">
                {/* Animated Illustration */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <div className="w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                    </div>
                    
                    <div className="relative">
                        <div className="inline-flex items-center justify-center p-8 bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                           <Telescope size={120} className="text-indigo-600 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" strokeWidth={1.5} />
                           
                           <motion.div 
                             animate={{ rotate: [0, 10, -10, 0] }}
                             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                             className="absolute top-6 right-6 text-amber-500"
                           >
                              <TriangleAlert size={32} fill="currentColor" fillOpacity={0.1} />
                           </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-9xl font-black text-slate-200 drop-shadow-sm select-none"
                >
                    404
                </motion.h1>
                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-3xl font-bold text-slate-900 mt-2">Oops! Page not found</h2>
                    <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">
                        The page you're searching for might have been moved, deleted, or never existed in the first place.
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Home size={18} />
                        Back to Dashboard
                    </Link>
                    
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </motion.div>

                {/* Brand Footnote */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-16 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]"
                >
                    Smart Aspirants
                </motion.p>
            </div>
        </div>
    );
};

export default NotFound;
