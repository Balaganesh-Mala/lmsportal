import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import BookDemoModal from './BookDemoModal';
import { useSettings } from '../context/SettingsContext';
import img01 from '../assets/01T.png';
import img02 from '../assets/02T.png';
import img03 from '../assets/03T.png';
import img04 from '../assets/04T.png';
import img05 from '../assets/05T.png';
import img06 from '../assets/06T.png';
import googleLogo from '../assets/googleLogo.png';


const HeroBanner = () => {
    const { getContactInfo } = useSettings();
    const phone = getContactInfo('phone') || '+919963624087';

    const [banners, setBanners] = useState([]);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/banners`);
                const allBanners = res.data;
                // Filter: Active AND Order 1-5 (Hero Section)
                const heroBanners = allBanners.filter(b => b.isActive && b.order >= 1 && b.order <= 5);

                if (heroBanners.length > 0) {
                    setBanners(heroBanners);
                }
            } catch (err) {
                console.error("Error fetching hero banners:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const [slidesToShow, setSlidesToShow] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setSlidesToShow(1);
            } else if (width < 1280) { // adjusted breakpoint for better fit
                setSlidesToShow(2);
            } else {
                setSlidesToShow(3);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false, // Match usage or keep false as per design
        centerMode: window.innerWidth < 768, // Add center mode for mobile for better preview
        centerPadding: window.innerWidth < 768 ? '40px' : '0px',
    };

    return (
        <section className="relative min-h-[95vh] flex items-center bg-gradient-to-br from-orange-50/40 via-white to-gray-50/50 overflow-hidden pt-32 pb-16 md:pt-28 md:pb-20 mx-auto px-4 md:px-12 lg:px-24">

            {/* Light Grid Background */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)'
            }}></div>

            {/* Background Blobs */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-orange-100/30 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-50/40 rounded-full blur-3xl opacity-60" />

            <div className="container mx-auto relative z-10 grid lg:grid-cols-12 gap-12 items-center">

                {/* Text Content (Left) */}
                <div className="lg:col-span-6 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs md:text-sm font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            New Batch Starting Soon
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.12] mb-6 tracking-tight">
                            Become Job Ready for <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 block md:inline">
                                MNC Finance Roles
                            </span> <br />
                            in 2-3 Months
                        </h1>

                        <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                            Master Investment Banking Operations | Fund Accounting | Corporate Accounting | KYC/AML | Data Skills
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsDemoModalOpen(true)}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                Book your Slot <ArrowRight size={20} />
                            </motion.button>
                            <motion.a
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                href={`tel:${phone}`}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-orange-50/10 hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Phone size={20} className="text-orange-600" />
                                Call Now
                            </motion.a>
                        </div>

                        {/* Trust Section */}
                        <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 items-center lg:items-start">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[img01, img02, img03, img04, img05, img06].map((img, index) => (
                                        <div key={index} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shadow-sm">
                                            <img src={img} alt={`User ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full bg-orange-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-orange-600 shadow-sm">
                                        +
                                    </div>
                                </div>
                                <div className="text-sm text-left ml-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <img
                                            src={googleLogo}
                                            alt="Google"
                                            className="w-18 h-4 object-contain"
                                        />
                                        <span className="text-gray-900 font-bold">4.9/5</span>
                                        <div className="flex items-center text-yellow-400 text-xs">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <svg key={s} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-xs">Trusted by 1000+ Students</p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </div>
                {/* Visual Content (Right) - Student Carousel */}
                <div className="lg:col-span-6 relative h-full w-full min-h-[400px] md:min-h-[500px] flex items-center justify-center lg:pl-6">
                    <div className="w-full max-w-sm md:max-w-lg lg:max-w-xl">
                        {isLoading ? (
                            <div className="w-full flex gap-4 md:gap-6 items-center justify-center overflow-hidden px-2">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className={`relative flex flex-col bg-white/60 border border-gray-100 rounded-2xl h-[420px] w-full max-w-[280px] md:max-w-full animate-pulse ${item > 1 ? 'hidden md:flex flex-1' : 'flex-1'}`}>
                                        <div className="h-[35%] p-6 flex flex-col justify-between">
                                            <div className="w-24 h-6 bg-gray-200 rounded-md"></div>
                                            <div className="space-y-2">
                                                <div className="w-full h-3 bg-gray-200 rounded"></div>
                                                <div className="w-4/5 h-3 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-[65%] w-full bg-gray-200 flex items-end p-6 rounded-b-2xl">
                                            <div className="w-3/4 h-5 bg-gray-300 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : banners.length > 0 ? (
                        <Slider key={slidesToShow} {...settings}>
                            {banners.map((item) => (
                                <div key={item._id} className="px-3 pb-8 pt-4 cursor-grab active:cursor-grabbing">
                                    <div className="relative group overflow-hidden rounded-2xl transition-all duration-500 h-[430px] flex flex-col bg-white border border-gray-100 shadow-md hover:shadow-xl hover:border-orange-500/10 mx-auto max-w-[280px] md:max-w-full hover:-translate-y-1">

                                        {/* Top Content Area (approx 35%) */}
                                        <div className="relative h-[38%] p-5 flex flex-col justify-between z-20 bg-white">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="inline-block px-2.5 py-1 bg-orange-500/10 text-orange-600 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border border-orange-500/20">
                                                    Success Story
                                                </span>
                                            </div>

                                            <div className="mt-2">
                                                <p className="text-gray-500 text-[11px] font-medium line-clamp-3 leading-relaxed">
                                                    {item.description || "Placed at top firms"}
                                                </p>
                                                <p className="text-gray-900 text-[12px] font-bold mt-2">Placed at:</p>
                                            </div>
                                        </div>

                                        {/* Bottom Image Area (approx 62%) - Orange/Amber Gradient */}
                                        <div className="relative h-[62%] w-full flex items-end justify-center z-10 bg-gradient-to-t from-orange-600 to-transparent overflow-hidden">

                                            {/* Title Overlay */}
                                            <div className="absolute bottom-5 left-0 right-0 px-5 z-20 text-start">
                                                <h3 className="text-sm font-bold text-white tracking-wide drop-shadow-md leading-tight truncate">
                                                    {item.title || "Student Name"}
                                                </h3>
                                            </div>

                                            {/* Decorative shape */}
                                            <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/15 to-transparent pointer-events-none"></div>

                                            <img
                                                src={item.fileUrl}
                                                alt={item.title || "Student Success"}
                                                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                            />

                                            {/* Bottom dark/orange gradient overlay for depth */}
                                            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-orange-950/80 via-orange-900/40 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                        ) : null}
                    </div>

                    {/* Decorative Background Elements behind carousel */}
                    <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[80%] bg-gradient-to-tr from-orange-200/20 to-amber-200/20 rounded-[3rem] rotate-6 blur-2xl hidden md:block"></div>
                </div>

            </div>

            <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
        </section>
    );
};

export default HeroBanner;
