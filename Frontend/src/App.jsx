import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';

import './App.css';

function App() {
  return (
    <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <Navbar />
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </div>
      </div>
    </Router>
  );
}

export default App;