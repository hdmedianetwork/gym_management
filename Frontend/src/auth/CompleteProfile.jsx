import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { completeProfile, fetchBranches } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    profilePhoto: null,
    dateOfBirth: '',
    address: '',
    branch: '',
    weight: '',
    height: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const navigate = useNavigate();

  // Fetch branches when component mounts
  useEffect(() => {
    const getBranches = async () => {
      try {
        const response = await fetchBranches();
        if (response && response.success) {
          // The API now returns branches as an array of strings
          setBranches(response.branches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches. Please try again later.');
      } finally {
        setIsLoadingBranches(false);
      }
    };

    getBranches();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.profilePhoto || !formData.dateOfBirth || !formData.address || 
        !formData.branch || !formData.weight || !formData.height) {
      toast.error('All fields are required');
      return;
    }
    
    // Validate age (must be at least 16 years old)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 16 || (age === 16 && monthDiff < 0) || 
        (age === 16 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      toast.error('You must be at least 16 years old to register');
      return;
    }
    
    // Validate weight and height
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    
    if (weight < 30 || weight > 200) {
      toast.error('Please enter a valid weight (30-200 kg)');
      return;
    }
    
    if (height < 100 || height > 250) {
      toast.error('Please enter a valid height (100-250 cm)');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!userData.id) {
        throw new Error('User session expired. Please login again.');
      }

      // Create FormData for file upload
      const profileData = new FormData();
      profileData.append('userId', userData.id);
      profileData.append('profilePhoto', formData.profilePhoto);
      profileData.append('dateOfBirth', formData.dateOfBirth);
      profileData.append('address', formData.address);
      // Ensure branch is sent in lowercase to match backend validation
      profileData.append('branch', formData.branch.toLowerCase());
      profileData.append('weight', formData.weight);
      profileData.append('height', formData.height);

      const response = await completeProfile(profileData);
      
      if (response.success) {
        // Update token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        toast.success('Profile completed successfully!');
        navigate('/home');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-600 to-blue-500"></div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-gray-400">
                Please provide the following details to complete your registration
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Photo *
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="profilePhoto"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePhoto"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition duration-200"
                    >
                      Choose Photo
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none"
                  placeholder="Enter your full address"
                  required
                />
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Branch *
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoadingBranches}
                >
                  <option className='text-black' value="">Select a branch</option>
                  {branches.map((branch, index) => (
                    <option className='text-black' key={index} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight and Height */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="30"
                    max="200"
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="e.g., 70.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    min="100"
                    max="250"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="e.g., 175"
                    required
                  />
                </div>
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
                    Completing Profile...
                  </>
                ) : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;