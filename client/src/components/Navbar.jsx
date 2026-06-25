import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, ChevronRight } from 'lucide-react';
import { usePopup } from '../context/PopupContext';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

import { useSettings } from '../context/SettingsContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openPopup } = usePopup();
  const { settings } = useSettings();
  const location = useLocation();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const siteTitle = settings?.siteTitle || 'Smart Aspirants';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <>
      {/* Scroll Progress Bar at the very top of the screen */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />
      
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 border-b ${
          scrolled
            ? 'bg-white/85 backdrop-blur-lg shadow-md border-orange-500/10 py-2.5 shadow-orange-500/5'
            : 'bg-white/95 border-gray-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              {settings?.logoUrl && settings.logoUrl.trim() !== "" ? (
                <img
                  src={settings.logoUrl}
                  alt={siteTitle}
                  className="w-24 h-10 rounded-lg object-cover group-hover:rotate-6 transition-transform duration-300"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}

              {/* Fallback Logo (shown if no logoUrl or if image fails) */}
              <div
                className={`w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform duration-300 ${settings?.logoUrl ? 'hidden' : 'flex'}`}
              >
                {siteTitle.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-bold text-xl text-gray-900 leading-none group-hover:text-orange-600 transition-colors duration-300">{siteTitle}</span>
                <span className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">CAREER SOLUTIONS</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1 rounded-full border border-gray-100/50">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full ${
                      isActive
                        ? 'text-orange-600'
                        : 'text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 bg-orange-500/10 rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {link.name}
                  </Link>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href={import.meta.env.VITE_STUDENT_APP_URL || 'http://localhost:5174'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition-all duration-300 px-4 py-2 rounded-full border border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 hover:scale-105 active:scale-95"
              >
                <LogIn size={16} /> Student Login
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openPopup}
                className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-xl flex items-center gap-2 shadow-orange-500/15 group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                Get Quote <ChevronRight size={14} />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-orange-600 p-2 transition-colors rounded-full hover:bg-orange-50"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-100 overflow-hidden mt-3"
            >
              <div className="pt-3 pb-2 space-y-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-600'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )
                })}
                <div className="h-px bg-gray-100 my-3"></div>
                <a
                  href={import.meta.env.VITE_STUDENT_APP_URL || 'http://localhost:5174'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-orange-50/30 hover:text-orange-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn size={18} /> Student Login
                </a>
                <button
                  onClick={() => { openPopup(); setIsOpen(false); }}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:from-orange-700 hover:to-amber-600 shadow-lg shadow-orange-100 transition-all"
                >
                  Get Free Quote
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav >
    </>
  );
};

export default Navbar;
