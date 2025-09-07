import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiMapPin, 
  FiEdit3, 
  FiSave, 
  FiX,
  FiCamera,
  FiCreditCard,
  FiActivity,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getProfilePhoto, updateUserDetails } from '../utils/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    medicalConditions: '',
    fitnessGoals: ''
  });

  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        medicalConditions: user.medicalConditions || '',
        fitnessGoals: user.fitnessGoals || ''
      });
      
      // Load profile photo if user has one
      if (user._id) {
        loadProfilePhoto();
      }
    }
  }, [user]);

  const loadProfilePhoto = async () => {
    try {
      const photoBlob = await getProfilePhoto(user._id);
      const photoUrl = URL.createObjectURL(photoBlob);
      setProfilePhoto(photoUrl);
    } catch (error) {
      // User might not have a profile photo, which is fine
      // console.log('No profile photo found');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserDetails(user._id, editedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      address: user.address || '',
      emergencyContact: user.emergencyContact || '',
      medicalConditions: user.medicalConditions || '',
      fitnessGoals: user.fitnessGoals || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMembershipStatus = () => {
    if (user?.accountStatus === 'active') {
      return { status: 'Active', color: 'text-green-400', bgColor: 'bg-green-400/10' };
    } else if (user?.accountStatus === 'inactive') {
      return { status: 'Inactive', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    } else {
      return { status: 'Pending', color: 'text-red-400', bgColor: 'bg-red-400/10' };
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Please log in to view your profile</h2>
          <p className="text-gray-400">You need to be logged in to access this page</p>
        </div>
      </div>
    );
  }

  const membershipStatus = getMembershipStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your personal information and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                  <FiCamera className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {user.name || 'User Name'}
                </h2>
                <p className="text-gray-400 mb-3">{user.email}</p>
                
                {/* Membership Status */}
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${membershipStatus.color} ${membershipStatus.bgColor}`}>
                    {membershipStatus.status} Member
                  </span>
                  <span className="text-gray-400 text-sm">
                    Since {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <FiUser className="w-5 h-5 mr-2 text-blue-400" />
                  Personal Information
                </h3>
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editedUser.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 px-4 py-3 rounded-lg">
                        {user.name || 'Not specified'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      <FiMail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    <p className="text-white bg-gray-700/30 px-4 py-3 rounded-lg">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      <FiPhone className="w-4 h-4 inline mr-1" />
                      Mobile Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="mobile"
                        value={editedUser.mobile}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter mobile number"
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 px-4 py-3 rounded-lg">
                        {user.mobile || 'Not specified'}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      <FiCalendar className="w-4 h-4 inline mr-1" />
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editedUser.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 px-4 py-3 rounded-lg">
                        {formatDate(user.dateOfBirth)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2 text-green-400" />
                  Additional Information
                </h3>
                <div className="space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={editedUser.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 px-4 py-3 rounded-lg min-h-[88px]">
                        {user.address || 'Not specified'}
                      </p>
                    )}
                  </div>

                

                
                </div>
              </div>
            </div>

        
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;