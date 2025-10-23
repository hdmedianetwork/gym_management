
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  withCredentials: true
});

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Check admin email
  const handleEmailVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First check if admin exists
      const checkRes = await api.post("/check-admin-email", { email });
      // console.log("Admin check response:", checkRes.data);
      
      if (!checkRes.data.found) {
        toast.error("Admin not found");
        setIsLoading(false);
        return;
      }
      
      // If admin exists, send OTP
      await api.post("/admin/send-otp", { email });
      setShowOtp(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/admin/verify-otp", { email, otp });
      if ((res.data.message && res.data.message.includes("OTP verified")) || res.data.token) {
        toast.success("Admin verified");
        // Store the authentication token and admin status
        const token = res.data.token || 'admin-authenticated';
        localStorage.setItem('token', token);
        localStorage.setItem('isAdmin', 'true');
        
        // Set a flag to indicate we just logged in
        sessionStorage.setItem('justLoggedIn', 'true');
        
        // Check if there's a redirect URL in the location state
        const from = location.state?.from || '/admin';
        
        // Force a small delay to ensure state is updated
        setTimeout(() => {
          // Use navigate with replace to prevent going back to login
          navigate(from, { replace: true });
          // Force a reload to ensure all components get the updated auth state
          window.location.reload();
        }, 100);
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden w-full max-w-xs p-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">Admin Login</h3>
        {!showOtp ? (
          <form onSubmit={handleEmailVerify} className="space-y-4">
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="Enter admin email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded transition duration-200`}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div>
              <label htmlFor="adminOtp" className="block text-sm font-medium text-gray-300 mb-1">OTP</label>
              <input
                type="text"
                id="adminOtp"
                name="adminOtp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="Enter OTP"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded transition duration-200`}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
