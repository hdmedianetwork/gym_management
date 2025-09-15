const getApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = import.meta.env.DEV || host === 'localhost' || host === '127.0.0.1';
    if (isLocal) return 'http://localhost:5000';
    return window.location.origin;
  }
  return 'http://localhost:5000';
};
const API_BASE = getApiBase();

export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/admin/all-users`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }
    return data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store the token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (name, email, mobile, password) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, mobile, password }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const sendOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    return data;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

export const verifyOTP = async (email, otp, name = '', mobile = '', password = '') => {
  try {
    const requestBody = { email, otp };
    
    // Only include these fields if they're provided
    if (name) requestBody.name = name;
    if (mobile) requestBody.mobile = mobile;
    if (password) requestBody.password = password;
    
    const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Verification failed');
    }
    return data;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      localStorage.removeItem('token');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('token');
    return null;
  }
};

export const getSuccessfulPayments = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/payment/all-transactions`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch payments');
    }
    
    return data;
  } catch (error) {
    console.error('Get payments error:', error);
    throw error;
  }
};

export const syncUsersWithPayments = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/payment/sync-users`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync users');
    }
    
    return data;
  } catch (error) {
    console.error('Sync users error:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId, accountStatus) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ accountStatus })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user status');
    }
    return data;
  } catch (error) {
    console.error('Update user status error:', error);
    throw error;
  }
};

export const createUserManually = async (payload) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }
    return data;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

export const updateUserDetails = async (id, updates) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user details');
    }
    return data;
  } catch (error) {
    console.error('Update user details error:', error);
    throw error;
  }
};

// Plan-related API functions
export const getAllPlans = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/plans`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch plans');
    }
    
    return data.data; // Return the plans array
  } catch (error) {
    console.error('Get all plans error:', error);
    throw error;
  }
};

export const getPlanById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/plans/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch plan');
    }
    
    return data.data; // Return the plan object
  } catch (error) {
    console.error('Get plan by ID error:', error);
    throw error;
  }
};

export const getPlanByType = async (planType) => {
  try {
    const response = await fetch(`${API_BASE}/api/plans/type/${planType}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch plan');
    }
    
    return data.data; // Return the plan object
  } catch (error) {
    console.error('Get plan by type error:', error);
    throw error;
  }
};

export const sendPasswordResetOtp = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset OTP');
    }
    return data;
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    throw error;
  }
};

export const verifyPasswordResetOtp = async (email, otp) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Invalid or expired OTP');
    }
    return data;
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    throw error;
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Branch API functions
export const addBranch = async (branchData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(branchData),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add branch');
    }
    
    return data;
  } catch (error) {
    console.error('Add branch error:', error);
    throw error;
  }
};

export const fetchBranches = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/branches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch branches');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch branches error:', error);
    throw error;
  }
};

// Profile completion API functions
export const completeProfile = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/complete-profile`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: formData, // FormData object for file upload
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete profile');
    }
    return data;
  } catch (error) {
    console.error('Complete profile error:', error);
    throw error;
  }
};

export const checkProfileStatus = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/profile-status/${userId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check profile status');
    }
    return data;
  } catch (error) {
    console.error('Check profile status error:', error);
    throw error;
  }
};

// Plan management API functions (Admin only)
export const createPlan = async (planData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/plans`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create plan');
    }
    
    return data.data;
  } catch (error) {
    console.error('Create plan error:', error);
    throw error;
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update plan');
    }
    
    return data.data;
  } catch (error) {
    console.error('Update plan error:', error);
    throw error;
  }
};

export const deletePlan = async (planId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete plan');
    }
    
    return data;
  } catch (error) {
    console.error('Delete plan error:', error);
    throw error;
  }
};

// Coupon management API functions (Admin only)
export const getAllCoupons = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/coupons`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch coupons');
    }
    
    return data.data; // Return the coupons array
  } catch (error) {
    console.error('Get all coupons error:', error);
    throw error;
  }
};

export const getCouponById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/coupons/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch coupon');
    }
    
    return data.data; // Return the coupon object
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    throw error;
  }
};

export const getCouponByCode = async (code) => {
  try {
    const response = await fetch(`${API_BASE}/api/coupons/code/${code}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch coupon');
    }
    
    return data.data; // Return the coupon object
  } catch (error) {
    console.error('Get coupon by code error:', error);
    throw error;
  }
};

export const createCoupon = async (couponData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/coupons`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create coupon');
    }
    
    return data.data;
  } catch (error) {
    console.error('Create coupon error:', error);
    throw error;
  }
};

export const updateCoupon = async (couponId, couponData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/coupons/${couponId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update coupon');
    }
    
    return data.data;
  } catch (error) {
    console.error('Update coupon error:', error);
    throw error;
  }
};

export const deleteCoupon = async (couponId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/coupons/${couponId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete coupon');
    }
    
    return data;
  } catch (error) {
    console.error('Delete coupon error:', error);
    throw error;
  }
};

// Helper to check if response is successful (2xx)
const checkStatus = (response) => {
  if (response.ok) {
    return response;
  }
  // Don't log 404 errors to console
  if (response.status !== 404) {
    console.error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

export const getProfilePhoto = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/profile-photo/${userId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      credentials: 'include',
    }).catch(error => {
      // Network errors are caught here
      console.error('Network error fetching profile photo:', error);
      return null;
    });
    
    if (!response) return null; // In case of network error
    
    try {
      // This will throw for non-2xx responses
      await checkStatus(response);
      
      // Only try to get blob if response has content
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      // 404 and other non-2xx responses are handled here
      if (error.response && error.response.status === 404) {
        return null; // No profile photo found
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    // Only log unexpected errors
    if (error.message !== 'Failed to fetch') { // Skip network errors already logged
      console.error('Unexpected error in getProfilePhoto:', error);
    }
    return null;
  }
};
