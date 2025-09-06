import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOTP } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Handle OTP input change
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('').slice(0, 6);
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the temp user data from localStorage
      const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');
      
      if (!tempUser.email) {
        throw new Error('Session expired. Please sign up again.');
      }

      // Call the verification API
      const response = await verifyOTP(
        tempUser.email,
        otpString,
        tempUser.name,
        tempUser.mobile,
        tempUser.password
      );
      
      if (response.token) {
        // Store user data and token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Clean up temp data
        localStorage.removeItem('tempUser');
        
        toast.success('Registration successful!');
        
        // Check if profile is complete
        if (response.user.profileComplete) {
          navigate('/home');
        } else {
          navigate('/complete-profile');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      setIsLoading(true);
      // Get the temp user data
      const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');
      
      if (!tempUser.email) {
        throw new Error('Session expired. Please sign up again.');
      }
      
      // Call the resend OTP API
      await sendOTP(tempUser.email);
      
      setCountdown(30);
      setCanResend(false);
      toast.success('New OTP sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (otpInputs.current[0]) {
      otpInputs.current[0].focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-600 to-blue-500"></div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-gray-400">
                We've sent a 6-digit code to <span className="text-blue-400">{email || 'your email'}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center space-x-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    ref={(el) => (otpInputs.current[index] = el)}
                    className={`w-12 h-16 text-2xl text-center bg-gray-700/50 border-2 ${
                      digit ? 'border-blue-500' : 'border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${
                  isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : 'Verify OTP'}
              </button>

              <div className="text-center mt-6">
                <p className="text-gray-400">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend}
                    className={`font-medium ${
                      canResend ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500'
                    }`}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpVerification;
