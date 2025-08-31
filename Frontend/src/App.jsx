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
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/signup', '/verify-otp', '/adminlogin'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {showNavbar && <Navbar />}
      <div className={`min-h-full ${showNavbar ? 'pt-16' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Auth Routes - Only accessible when not authenticated */}
          <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute requireAuth={false}><SignUp /></ProtectedRoute>} />
          <Route path="/verify-otp" element={<ProtectedRoute requireAuth={false}><OtpVerification /></ProtectedRoute>} />
          <Route path="/adminlogin" element={<ProtectedRoute requireAuth={false}><AdminLogin /></ProtectedRoute>} />

          {/* Protected Routes - Only accessible when authenticated */}
          <Route path="/admin" element={<ProtectedRoute requireAuth={true}><AdminHome /></ProtectedRoute>} />

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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;