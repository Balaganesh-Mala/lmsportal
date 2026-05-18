import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import ManageTests from './pages/ManageTests';
import Dashboard from './pages/Dashboard';
import Banners from './pages/Banners';
import Layout from './components/Layout';
import FeeManagement from './pages/FeeManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Inquiries from './pages/Inquiries';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Courses from './pages/Courses';
import ManageCourseModules from './pages/ManageCourseModules';
import Blogs from './pages/Blogs';
import QRScanner from './pages/QRScanner';
import AttendanceHistory from './pages/AttendanceHistory';
import AddTrainer from './pages/AddTrainer'; // New
import TrainerList from './pages/TrainerList'; // New
import TrainerDetails from './pages/TrainerDetails'; // New
import StudentJobs from './pages/StudentJobs';
import Meetings from './pages/Meetings';
import ManageDemos from './pages/ManageDemos';
import ManageReviews from './pages/ManageReviews';
import ManageBatches from './pages/ManageBatches';
import BatchStudents from './pages/BatchStudents';
import StudentSubmissions from './pages/StudentSubmissions';

// Interviews
import MockInterviewSettings from './pages/Interviews/MockInterviewSettings';
import ConductMockInterview from './pages/Interviews/ConductMockInterview';
import MockInterviewHistory from './pages/Interviews/MockInterviewHistory';
import QuestionBank from './pages/Interviews/QuestionBank';
import PerformanceAnalytics from './pages/Interviews/PerformanceAnalytics';
import InterviewScheduler from './pages/Interviews/InterviewScheduler';
import StudyMaterialsManagement from './pages/Materials/StudyMaterialsManagement';
import Announcements from './pages/Announcements';
import SupportInbox from './pages/SupportInbox';
import SubscriptionSettings from './pages/SubscriptionSettings';
import Subscribers from './pages/Subscribers';
import CouponManagement from './pages/CouponManagement';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password/:token" element={<UpdatePassword />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/add" element={<AddStudent />} />
          <Route path="students/edit/:id" element={<AddStudent />} />
          <Route path="banners" element={<Banners />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="support-inbox" element={<SupportInbox />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId/modules" element={<ManageCourseModules />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="student-jobs" element={<StudentJobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="fees" element={<FeeManagement />} />
          <Route path="expenses" element={<ExpenseManagement />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="attendance/qr-scanner" element={<QRScanner />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="subscription-settings" element={<SubscriptionSettings />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="coupon-management" element={<CouponManagement />} />
          <Route path="trainers" element={<TrainerList />} />
          <Route path="trainers/add" element={<AddTrainer />} />
          <Route path="trainers/edit/:id" element={<AddTrainer />} />
          <Route path="trainers/:id" element={<TrainerDetails />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="tests" element={<ManageTests />} />
          <Route path="demos" element={<ManageDemos />} />
          <Route path="reviews" element={<ManageReviews />} />
          <Route path="batches" element={<ManageBatches />} />
          <Route path="batches/:batchId/students" element={<BatchStudents />} />
          <Route path="submissions" element={<StudentSubmissions />} />

          {/* Interviews & Assessments */}
          <Route path="interviews/settings" element={<MockInterviewSettings />} />
          <Route path="interviews/conduct" element={<ConductMockInterview />} />
          <Route path="interviews/history" element={<MockInterviewHistory />} />
          <Route path="interviews/questions" element={<QuestionBank />} />
          <Route path="interviews/analytics" element={<PerformanceAnalytics />} />
          <Route path="interviews/schedule" element={<InterviewScheduler />} />
          <Route path="materials" element={<StudyMaterialsManagement />} />

          {/* Add more routes here as we migrate */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
