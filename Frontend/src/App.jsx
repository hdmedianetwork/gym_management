import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import OtpVerification from './auth/OtpVerification';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import AdminHome from './Admin/AdminHome';
import AdminLogin from './auth/AdminLogin';
import CompleteProfile from './auth/CompleteProfile';
import ForgotPassword from './auth/ForgotPassword';
import PaymentStatus from './pages/PaymentStatus';
import Profile from './pages/Profile';
import Plan from './pages/Plan';
import Settings from './pages/Settings';
import TerminatedUsersPage from './Admin/TerminatedUsersPage';
import BranchesPage from './Admin/BranchesPage';
import PlansPage from './Admin/PlansPage';
import RevenuePage from './Admin/RevenuePage';
import CouponsPage from './Admin/CouponsPage';
import AdminSettings from './Admin/AdminSettings';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileCompletionGuard from './components/ProfileCompletionGuard';
import { AdminProvider } from './context/AdminContext';
import './App.css';

// Component to handle payment status page access
const PaymentStatusRedirect = () => {
  const paymentCompleted = localStorage.getItem('paymentCompleted') === 'true';
  
  // If payment is already completed, redirect to home
  if (paymentCompleted) {
    return <Navigate to="/" replace />;
  }
  
  return <PaymentStatus />;
};

function AppContent() {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/signup', '/verify-otp', '/adminlogin', '/payment-status', '/complete-profile', '/forgot-password'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {showNavbar && <Navbar />}
      <div className={`min-h-screen ${showNavbar ? 'lg:ml-72 pt-16 lg:pt-0' : ''}`}>
        <Routes>
          {/* Protected Home Route */}
          <Route path="/" element={
            <ProtectedRoute requireAuth={true}>
              <ProfileCompletionGuard><Home /></ProfileCompletionGuard>
            </ProtectedRoute>
          } />
          
          {/* Redirect old /home to root for backward compatibility */}
          <Route path="/home" element={
            <Navigate to="/" replace />
          } />
          <Route path="/contact" element={<ContactUs />} />

          {/* Payment Status - Only accessible when coming from payment flow */}
          <Route path="/payment-status" element={<PaymentStatusRedirect />} />

          {/* Auth Routes - Only accessible when not authenticated */}
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false} redirectTo="/">
              <Login />
            </ProtectedRoute>
          } />
          <Route path="/signup" element={<ProtectedRoute requireAuth={false}><SignUp /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ProtectedRoute requireAuth={false}><ForgotPassword /></ProtectedRoute>} />
          <Route path="/verify-otp" element={<ProtectedRoute requireAuth={false}><OtpVerification /></ProtectedRoute>} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/adminlogin" element={<ProtectedRoute requireAuth={false}><AdminLogin /></ProtectedRoute>} />

          {/* Protected Routes - Only accessible when authenticated */}
          <Route path="/admin" element={<ProtectedRoute requireAuth={true}><AdminHome /></ProtectedRoute>} />
          <Route path="/admin/terminated-users" element={<ProtectedRoute requireAuth={true}><TerminatedUsersPage /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute requireAuth={true}><BranchesPage /></ProtectedRoute>} />
          <Route path="/admin/plans" element={<ProtectedRoute requireAuth={true}><PlansPage /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute requireAuth={true}><RevenuePage /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute requireAuth={true}><CouponsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAuth={true}><AdminSettings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requireAuth={true}><ProfileCompletionGuard><Profile /></ProfileCompletionGuard></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute requireAuth={true}><Plan /></ProtectedRoute>} />
          <Route path="/settings" element={
            <ProtectedRoute requireAuth={true}>
              <ProfileCompletionGuard><Settings /></ProfileCompletionGuard>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;