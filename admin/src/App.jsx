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
import Courses from './pages/Courses';
import ManageCourseModules from './pages/ManageCourseModules';
import Blogs from './pages/Blogs';
import AddTrainer from './pages/AddTrainer'; // New
import TrainerList from './pages/TrainerList'; // New
import TrainerDetails from './pages/TrainerDetails'; // New
import Meetings from './pages/Meetings';
import ManageReviews from './pages/ManageReviews';
import ManageBatches from './pages/ManageBatches';
import BatchStudents from './pages/BatchStudents';

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
          <Route path="fees" element={<FeeManagement />} />
          <Route path="expenses" element={<ExpenseManagement />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="inquiries" element={<Inquiries />} />
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
          <Route path="reviews" element={<ManageReviews />} />
          <Route path="batches" element={<ManageBatches />} />
          <Route path="batches/:batchId/students" element={<BatchStudents />} />
          <Route path="materials" element={<StudyMaterialsManagement />} />

          {/* Add more routes here as we migrate */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
