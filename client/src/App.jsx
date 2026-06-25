import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import QuotePopup from './components/QuotePopup';
import FloatingContact from './components/FloatingContact';
import WhatsAppButton from './components/WhatsAppButton';
import FloatingLocation from './components/FloatingLocation';
import ScrollToTop from './components/ScrollToTop';

import Contact from './pages/Contact';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';

import About from './pages/About';
import StudentLogin from './pages/StudentLogin';
import NotFound from './pages/NotFound';
import TermsConditions from './pages/TermsConditions';

// Admin Imports
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import Banners from './pages/Admin/Banners';

import { PopupProvider } from './context/PopupContext';
import { SettingsProvider } from './context/SettingsContext';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <SettingsProvider>
      <PopupProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <FloatingContact />
                <WhatsAppButton />
                <FloatingLocation />
                <main className="flex-grow">
                  <Home />
                </main>
                <Footer />
              </div>
            } />

            <Route path="/courses" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <main className="flex-grow"><Courses /></main>
                <Footer />
              </div>
            } />
            <Route path="/courses/:id" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <main className="flex-grow"><CourseDetails /></main>
                <Footer />
              </div>
            } />

            <Route path="/about" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <main className="flex-grow"><About /></main>
                <Footer />
              </div>
            } />

            <Route path="/contact" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <main className="flex-grow"><Contact /></main>
                <Footer />
              </div>
            } />
            
            <Route path="/terms-conditions" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <QuotePopup />
                <main className="flex-grow"><TermsConditions /></main>
                <Footer />
              </div>
            } />

            <Route path="/student/login" element={<StudentLogin />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="banners" element={<Banners />} />
              <Route path="courses" element={<div className="p-4">Courses Management</div>} />
              <Route path="inquiries" element={<div className="p-4">Inquiries Management</div>} />
              <Route path="jobs" element={<div className="p-4">Jobs Management</div>} />
              <Route path="blogs" element={<div className="p-4">Blogs Management</div>} />
              <Route path="reviews" element={<div className="p-4">Reviews Management</div>} />
              <Route path="settings" element={<div className="p-4">Settings</div>} />
            </Route>

            {/* 404 Not Found Route */}
            <Route path="*" element={<NotFound />} />


          </Routes>
        </Router>
      </PopupProvider>
    </SettingsProvider>
  );
}

export default App;
