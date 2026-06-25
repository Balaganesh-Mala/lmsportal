import React, { useState } from 'react';
import { Plus, Minus, ArrowRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();
  const { getContactInfo } = useSettings();
  const contactWhatsApp = getContactInfo('whatsapp');
  const phoneNumber = contactWhatsApp ? contactWhatsApp.replace(/\D/g, '') : '';

  const faqs = [
    {
      question: "What specific finance roles can I apply for after this course?",
      answer: "After completing this program, you can apply for entry-level roles such as Investment Banking Operations Analyst, Fund Accountant, AP/AR/R2R/P2P/O2C Analyst, KYC/AML Analyst, and MIS or Reporting Executive across MNCs, BFSI companies, and corporate organizations. This program equips you with multiple career opportunities, so you’re not limited to just one path as a fresher."
    },
    {
      question: "Is this course suitable for non-commerce graduates?",
      answer: "No, this program is specifically designed for students from commerce and finance backgrounds such as B.Com, BBA, MBA (Finance), and M.Com. Since the training involves core accounting, financial concepts, and real-time processes, having a basic understanding of commerce is essential to grasp the concepts effectively and succeed in the program."
    },
    {
      question: "Do you teach practical Financial Modeling?",
      answer: "Yes, Financial Modeling is the core of our program. You will build comprehensive 3-statement models, DCF valuations, and LBO models from scratch using real historical data of public companies."
    },
    {
      question: "Where do our students work?",
      answer: "Smart Aspirants students are working in reputed organizations across the finance and corporate sector, including companies like Wells Fargo, State Street, S&P Global, FactSet, Genpact, Accenture, KFintech, Alter Domus, CES, MSN Laboratories, and Computershare"
    }
  ];

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const currentUrl = encodeURIComponent(window.location.href);
  const whatsappMessage = encodeURIComponent("Hi, I was looking at the FAQ section and have a question. Can you help?");

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

          {/* Left Column: Sticky Header info */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-4 block">Support Center</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                Frequently Asked <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Questions</span>
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Clear your doubts and make an informed decision about your career
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {contactWhatsApp && (
                  <a
                    href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <MessageCircle className="mr-2" size={20} />
                    Chat with us
                  </a>
                )}
                <button
                  onClick={() => navigate('/courses')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  Explore Courses
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ List */}
          <div className="lg:col-span-7">
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div key={index} className="py-2">
                  <button
                    className="w-full py-6 flex items-start justify-between text-left focus:outline-none group"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className={`text-lg font-medium transition-colors duration-200 ${activeIndex === index ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                      {faq.question}
                    </span>
                    <span className={`ml-6 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      {activeIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {activeIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8 text-gray-500 leading-relaxed text-base">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FaqSection;
