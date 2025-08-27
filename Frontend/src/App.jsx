import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import AdminHome from './Admin/AdminHome';

import './App.css';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {!isHomePage && <Navbar />}
      <div className={`min-h-full ${!isHomePage ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/admin" element={<AdminHome />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;