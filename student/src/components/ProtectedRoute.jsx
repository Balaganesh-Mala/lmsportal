import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const routeAccessMap = {
  '/jobs': 'jobs',
  '/payments': 'payments',
  '/courses': 'myCourses',
  '/materials': 'myCourses',
  '/course': 'myCourses', // course player
  '/typing-practice': 'typingPractice',
  '/typing-trainer': 'typingPractice', // Assuming trainer goes with practice or a separate key? The layout uses typingPractice for both usually, but wait, layout only links practice. Let's use typingPractice.
  '/mock-interview': 'aiMockInterview',
  '/my-interviews': 'aiMockInterview',
  '/my-attendance': 'attendance',
  '/my-qr': 'myQR',
  '/profile': 'profile',
  '/settings': 'settings'
};

const ProtectedRoute = ({ children, skipTrialCheck = false }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('studentUser'));

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status !== 'Active') {
    localStorage.removeItem('studentUser');
    return <Navigate to="/login" state={{ error: 'Your account is inactive. Please contact support.' }} replace />;
  }

  // 10-Day Free Trial Logic
  if (!skipTrialCheck) {
    if (user.trialEndsAt && new Date() > new Date(user.trialEndsAt) && !user.isSubscribed) {
      return <Navigate to="/subscription" replace />;
    }
  }

  // Check feature access
  if (user.access) {
    const currentPath = location.pathname;
    // Find matching route prefix
    const matchedRoute = Object.keys(routeAccessMap).find(route => currentPath.startsWith(route));
    if (matchedRoute) {
      const accessKey = routeAccessMap[matchedRoute];
      if (user.access[accessKey] === false) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
