import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Share2, Download } from 'lucide-react';
import certificateSample from '../assets/certificateSample.jpg';

const CertificateSection = () => {
    return (
        <section className="py-24 bg-white overflow-hidden relative mx-auto px-4 md:px-12 lg:px-24">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-accent-50 rounded-full blur-3xl opacity-50"></div>

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Content */}
                    <div className="order-2 lg:order-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold">
                            <Award size={18} />
                            <span>Official Certification</span>
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                            Get Certified by <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-300">
                                Smart Aspirants
                            </span>
                        </h2>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Upon successful completion of your training, receive a verified industry-recognized certificate. Validate your expertise in <strong>Global Accounting, Investment Banking, and Taxation</strong> to top recruiters.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Recognized by Top Financial Firms",
                                "Valid for Job Applications & LinkedIn",
                                "Verifiable Credential ID"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <CheckCircle size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-gray-700 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <button className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2">
                            Get Certified Today <Share2 size={18} />
                        </button>
                    </div>

                    {/* Right Column: Certificate Image */}
                    <div className="order-1 lg:order-2 relative perspective-1000 flex justify-center">
                        <motion.div
                            initial={{ rotateY: 10, rotateX: 5 }}
                            whileHover={{ rotateY: 0, rotateX: 0 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="relative w-full max-w-2xl transform rotate-2 lg:rotate-3 hover:rotate-0 transition-transform duration-500"
                        >
                            <img
                                src={certificateSample}
                                alt="Smart Aspirants Certificate Sample"
                                className="w-full h-auto rounded-lg shadow-2xl border-[12px] border-white"
                            />
                        </motion.div>

                        {/* Floating Badge */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:flex items-center gap-4 z-20"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Download size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Digital Copy</p>
                                <p className="text-xs text-gray-500">Instant Access</p>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CertificateSection;
