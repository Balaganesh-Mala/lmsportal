import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { Shield, FileText, CheckCircle, BookOpen, CreditCard, Copyright, Briefcase, MessageSquare, RefreshCw, Scale } from 'lucide-react';

const TermsConditions = () => {
    const [activeSection, setActiveSection] = useState('acceptance');

    useEffect(() => {
        window.scrollTo(0, 0);

        const handleScroll = () => {
            const sections = document.querySelectorAll('section[id]');
            const scrollY = window.pageYOffset;

            sections.forEach(current => {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 150;
                const sectionId = current.getAttribute('id');

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    setActiveSection(sectionId);
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    const sections = [
        { id: 'acceptance', title: '1. Acceptance of Terms', icon: FileText },
        { id: 'enrollment', title: '2. Course Enrollment', icon: BookOpen },
        { id: 'payments', title: '3. Payments & Refunds', icon: CreditCard },
        { id: 'ip', title: '4. Intellectual Property', icon: Copyright },
        { id: 'placement', title: '5. Placement Assistance', icon: Briefcase },
        { id: 'conduct', title: '6. Platform Conduct', icon: MessageSquare },
        { id: 'modifications', title: '7. Modifications', icon: RefreshCw },
        { id: 'governing', title: '8. Governing Law', icon: Scale },
    ];

    return (
        <div className="bg-[#F9FAFB] min-h-screen relative font-sans text-slate-900 pb-20">
            <SEO 
                title="Terms & Conditions | Smart Aspirants" 
                description="Read our comprehensive terms of service, conditions for enrollment, and platform usage policies."
            />
            
            {/* Cinematic Header Section */}
            <div className="pt-40 pb-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 relative overflow-hidden shadow-2xl shrink-0">
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                {/* Animated Header Specific Blobs */}
                <motion.div
                    animate={{ x: [-200, 800, -200], y: [-200, 200, -200], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[140px] pointer-events-none"
                />
                <motion.div
                    animate={{ x: [800, -200, 800], y: [200, -200, 200], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] pointer-events-none"
                />

                <div className="container mx-auto px-6 md:px-12 relative z-10 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 text-indigo-200 text-xs font-bold tracking-widest uppercase mx-auto"
                    >
                        <Shield className="w-4 h-4 text-indigo-400" />
                        Legal Information
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight relative z-10"
                    >
                        Terms & <span className="text-indigo-400">Conditions</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-300 max-w-2xl mx-auto font-medium"
                    >
                        Please read these terms carefully before utilizing our platform or enrolling in our premier finance programs.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm font-medium text-slate-400 mt-4"
                    >
                        Last Updated: <span className="text-white">April 2, 2026</span>
                    </motion.div>
                </div>
            </div>

            {/* Content Section with Sticky Sidebar */}
            <div className="container mx-auto px-6 lg:px-12 mt-16 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* Sticky Sidebar Navigation */}
                    <div className="lg:w-1/3 hidden lg:block">
                        <div className="sticky top-28 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 px-4">Contents</h3>
                            <nav className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                                                isActive 
                                                ? 'bg-indigo-50 text-indigo-700 font-bold' 
                                                : 'text-slate-600 hover:bg-slate-50 font-medium'
                                            }`}
                                        >
                                            <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                            <span className="truncate">{section.title}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                            
                            <div className="mt-8 pt-8 border-t border-slate-100 px-4">
                                <p className="text-sm text-slate-500 font-medium mb-4">Have questions regarding our policies?</p>
                                <a href="/contact" className="w-full block text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md">
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:w-2/3 space-y-10">
                        <div className="bg-indigo-50 border border-indigo-100 p-6 md:p-8 rounded-2xl text-indigo-900 text-lg leading-relaxed shadow-sm">
                            <strong className="text-indigo-700 block mb-2 font-black">Welcome to Smart Aspirants.</strong> 
                            By browsing, accessing, or using our website, platform, and educational services, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions.
                        </div>

                        <section id="acceptance" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><FileText size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    Welcome to <strong>Smart Aspirants</strong>. By browsing, accessing, or using our website, platform, and educational services, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
                                </p>
                            </div>
                        </section>

                        <section id="enrollment" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BookOpen size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">2. Course Enrollment</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p className="mb-4">When you enroll in any of our premium finance and accounting programs, you agree to:</p>
                                <ul className="space-y-4 list-none pl-0">
                                    <li className="flex items-start bg-slate-50 p-4 rounded-xl">
                                        <CheckCircle className="text-indigo-600 mr-4 shrink-0 mt-1" size={20} />
                                        <span><strong className="text-slate-900 block mb-1">Account Responsibility</strong> You must provide accurate, current, and complete information during registration. You are strictly responsible for safeguarding your portal password.</span>
                                    </li>
                                    <li className="flex items-start bg-slate-50 p-4 rounded-xl">
                                        <CheckCircle className="text-indigo-600 mr-4 shrink-0 mt-1" size={20} />
                                        <span><strong className="text-slate-900 block mb-1">Right to Access</strong> Course access is granted exclusively to the enrolled student. Sharing login credentials, downloading copyrighted video lectures, or redistributing materials is strictly prohibited and leads to immediate termination.</span>
                                    </li>
                                    <li className="flex items-start bg-slate-50 p-4 rounded-xl">
                                        <CheckCircle className="text-indigo-600 mr-4 shrink-0 mt-1" size={20} />
                                        <span><strong className="text-slate-900 block mb-1">Duration of Access</strong> Access to materials is provided for the duration specified at the time of enrollment into your specific cohort.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section id="payments" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><CreditCard size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">3. Payments, Fees & Refunds</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    All fees must be paid in full prior to the commencement of the course or exactly as per the agreed-upon installment structure (if applicable). Smart Aspirants reserves the right to suspend or restrict access if installments are overdue.
                                </p>
                                <div className="mt-6 border-l-4 border-indigo-500 pl-6 py-2 bg-indigo-50/50 rounded-r-xl">
                                    <strong className="text-indigo-900 block mb-2 font-bold">Refund Policy</strong>
                                    Due to the immediate access granted to premium digital resources, study materials, and proprietary curriculum upon enrollment, all fees paid are <strong>non-refundable</strong> unless specifically stated otherwise in writing prior to enrollment or as required by law.
                                </div>
                            </div>
                        </section>

                        <section id="ip" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Copyright size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">4. Intellectual Property</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    All content provided by Smart Aspirants—including but not limited to video lectures, PDF notes, study materials, curriculum design, assignments, code, and site graphics—is the exclusive intellectual property of Smart Aspirants and is protected by comprehensive copyright laws.
                                </p>
                                <p>
                                    You are granted a limited, personal, non-transferable license to view and use these materials solely for your personal educational development. Commercial reproduction or external distribution is firmly prohibited.
                                </p>
                            </div>
                        </section>

                        <section id="placement" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Briefcase size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">5. Placement Assistance</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    For courses that include "Placement Assistance", Smart Aspirants is committed to providing resume building, interview preparation, and connecting students with relevant hiring partners. However, we <strong>do not guarantee job placement</strong>, as hiring decisions remain entirely at the discretion of the recruiting organizations. Our goal is to maximize your employability through premium skill training.
                                </p>
                            </div>
                        </section>

                        <section id="conduct" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><MessageSquare size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">6. Platform Conduct</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    Students engaging in our community forums, live sessions, or any interactive medium must maintain a professional demeanor. Harassment, use of abusive language, spamming, or disruptive behavior will not be tolerated and may lead to permanent expulsion from the program without refund.
                                </p>
                            </div>
                        </section>

                        <section id="modifications" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><RefreshCw size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">7. Modifications</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    Smart Aspirants reserves the right to modify, alter, or update these Terms and Conditions at any time without prior notice. The updated date at the top of this page indicates the latest revision. Continued use of our platform post-modification implies your acceptance of the newly established terms.
                                </p>
                            </div>
                        </section>

                        <section id="governing" className="scroll-mt-28 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Scale size={24} /></div>
                                <h2 className="text-2xl font-bold text-slate-900">8. Governing Law</h2>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p>
                                    These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts.
                                </p>
                            </div>
                        </section>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
