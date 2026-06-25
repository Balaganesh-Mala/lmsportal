import React from 'react';
import SEO from '../components/SEO';
import HeroBanner from '../components/HeroBanner';
import CompanyLogos from '../components/CompanyLogos';
import TechLogos from '../components/TechLogos';
import AboutSection from '../components/AboutSection';
import CoursesSection from '../components/CoursesSection';
import CertificateSection from '../components/CertificateSection';
import ReviewsSection from '../components/ReviewsSection';
import FaqSection from '../components/FaqSection';
import StudentSuccessDashboard from '../components/StudentSuccessDashboard';
import LocationSection from '../components/LocationSection';
import BottomNav from '../components/BottomNav';


const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="Smart Aspirants"
        description="Launch your career with Smart Aspirants. Expert-led courses in Global Accounting, Investment Banking, Fund Accounting, R2R, P2P, KYC/AML, AP/AR, Data Skills, Excel, Power BI, MS Office."
      />

      {/* Hero Section */}
      <HeroBanner />

      {/* About Section */}
      <AboutSection />

      {/* Tech Logos Section */}
      <TechLogos />

      {/* Courses Section */}
      <CoursesSection />



      {/* Certificate Section }
      <CertificateSection />*/}

      {/* Student Success Dashboard */}
      <StudentSuccessDashboard />

      {/* Company Logos Section */}
      <CompanyLogos />

      {/* Reviews Section */}
      <ReviewsSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Location Section */}
      <LocationSection />
      <BottomNav />
    </div>

  );
};

export default Home;
