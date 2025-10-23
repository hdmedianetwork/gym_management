import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSettings, FiMail, FiShield, FiUserPlus, FiSave, FiEdit2, FiTrash2 } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

// Set the base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies with the request
  headers: {
    'Content-Type': 'application/json',
  },
});

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [websiteName, setWebsiteName] = useState('Gym Pro');
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);

  // Fetch admin list on component mount
  useEffect(() => {
    const fetchAdminList = async () => {
      try {
        // console.log('Fetching admin list from:', `${API_BASE_URL}/auth/admin/list`);
        const response = await api.get('/auth/admin/list');
        
        if (response.data?.success) {
          // Set the admins to state to display in the UI
          console.log('Fetched admins:', response.data.admins);
          setAdmins(response.data.admins);
          // console.log('Admin emails:', response.data.admins.map(a => a.email));
        } else {
          console.error('Unexpected response format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching admin list:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error('Failed to load admin list');
      } finally {
        setIsLoadingAdmins(false);
      }
    };
    
    fetchAdminList();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      // Using /admin/add endpoint
      const response = await api.post('/auth/admin/add', { email: newAdminEmail });
      if (response.data.success) {
        toast.success('Admin access granted successfully');
        setShowAddAdminModal(false);
        setNewAdminEmail('');
        
        // Refresh the admin list using the new endpoint
        const adminsRes = await api.get('/auth/admin');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to grant admin access');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddAdminModal = () => {
    setShowAddAdminModal(true);
    setNewAdminEmail('');
  };

  const closeAddAdminModal = () => {
    setShowAddAdminModal(false);
    setNewAdminEmail('');
  };

  const openEditModal = (admin) => {
    console.log('Opening edit modal for admin:', admin);
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAdmin(null);
    setEditEmail('');
  };

  const handleEditAdmin = async () => {
    if (!editEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!editingAdmin || !editingAdmin._id) {
      console.error('No admin ID found:', editingAdmin);
      toast.error('Error: Admin ID not found');
      return;
    }

    console.log('Updating admin:', editingAdmin._id, 'with email:', editEmail);
    setIsSaving(true);
    try {
      const response = await api.put(`/auth/admin/${editingAdmin._id}`, { email: editEmail });
      if (response.data.success) {
        toast.success('Admin email updated successfully');
        closeEditModal();
        
        // Refresh the admin list
        const adminsRes = await api.get('/auth/admin/list');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to update admin');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (admin) => {
    console.log('Opening delete modal for admin:', admin);
    setDeletingAdmin(admin);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingAdmin(null);
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin || !deletingAdmin._id) {
      console.error('No admin ID found:', deletingAdmin);
      toast.error('Error: Admin ID not found');
      return;
    }

    console.log('Deleting admin:', deletingAdmin._id);
    setIsSaving(true);
    try {
      const response = await api.delete(`/auth/admin/${deletingAdmin._id}`);
      if (response.data.success) {
        toast.success('Admin removed successfully');
        closeDeleteModal();
        
        // Refresh the admin list
        const adminsRes = await api.get('/auth/admin/list');
        if (adminsRes.data?.success) {
          setAdmins(adminsRes.data.admins);
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setIsSaving(false);
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
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <FiShield className="mr-2 h-5 w-5 text-indigo-500" />
                  Manage Admin Access
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Grant or revoke administrator privileges
                </p>
              </div>
              <button
                onClick={openAddAdminModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiUserPlus className="mr-2 h-4 w-4" />
                Add New Admin
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-6">
                {/* Current Admins List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Current Admins</h4>
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="divide-y divide-gray-200">
                      {admins.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {admins.map((admin, index) => (
                            <li key={admin._id || index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                  <FiMail className="flex-shrink-0 h-4 w-4 text-gray-500 mr-3" />
                                  <span className="text-sm font-medium text-gray-900 truncate">{admin.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => openEditModal(admin)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit admin email"
                                  >
                                    <FiEdit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(admin)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete admin"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-gray-500">No admin accounts found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Website Settings Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FiSettings className="mr-2 h-5 w-5 text-indigo-500" />
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
                      <FiSettings className="h-5 w-5 text-gray-400" />
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

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Admin</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="newAdminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="newAdminEmail"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter email address"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeAddAdminModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAdmin}
                disabled={isSaving || !newAdminEmail.trim()}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving || !newAdminEmail.trim() ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Admin Email</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editAdminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="editAdminEmail"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter new email address"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditAdmin}
                disabled={isSaving || !editEmail.trim()}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving || !editEmail.trim() ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Admin</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to remove admin access for <strong className="text-gray-900">{deletingAdmin.email}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={isSaving}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;