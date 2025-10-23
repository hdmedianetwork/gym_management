import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSettings, FiMail, FiGlobe, FiShield, FiSave, FiUserPlus } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [websiteName, setWebsiteName] = useState('Gym Pro');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current website name on component mount
  useEffect(() => {
    const fetchWebsiteName = async () => {
      try {
        const response = await axios.get('/api/admin/website-name');
        if (response.data.success) {
          setWebsiteName(response.data.name);
        }
      } catch (error) {
        console.error('Error fetching website name:', error);
        toast.error('Failed to load website settings');
      }
    };
    
    fetchWebsiteName();
  }, []);

  const handleGrantAdmin = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/admin/grant-admin', { email });
      if (response.data.success) {
        toast.success('Admin access granted successfully');
        setEmail('');
      } else {
        throw new Error(response.data.message || 'Failed to grant admin access');
      }
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast.error(error.response?.data?.message || 'Failed to grant admin access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWebsiteName = async (e) => {
    e.preventDefault();
    if (!websiteName.trim()) {
      toast.error('Website name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put('/api/admin/website-name', { name: websiteName });
      if (response.data.success) {
        toast.success('Website name updated successfully');
        // Update the title in the browser tab
        document.title = websiteName;
      } else {
        throw new Error(response.data.message || 'Failed to update website name');
      }
    } catch (error) {
      console.error('Error updating website name:', error);
      toast.error(error.response?.data?.message || 'Failed to update website name');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              <FiSettings className="inline-block mr-2 h-7 w-7 text-indigo-600" />
              Admin Settings
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage administrator access and website settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Grant Admin Access Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FiShield className="mr-2 h-5 w-5 text-indigo-500" />
                Manage Admin Access
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Grant or revoke administrator privileges
              </p>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleGrantAdmin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Grant Admin Access by Email
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 rounded-md shadow-sm"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      <FiUserPlus className="mr-2 h-4 w-4" />
                      {isLoading ? 'Processing...' : 'Grant Access'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    The user will receive an email with further instructions.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Website Settings Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FiGlobe className="mr-2 h-5 w-5 text-indigo-500" />
                Website Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Configure your website's appearance and behavior
              </p>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleUpdateWebsiteName} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700">
                    Website Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGlobe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="websiteName"
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                      className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 py-3 sm:text-sm border border-gray-300 rounded-md shadow-sm"
                      placeholder="Enter your website name"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    This name will appear in the browser tab and email communications.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;