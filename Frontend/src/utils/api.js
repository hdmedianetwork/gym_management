const API_URL = import.meta.env.VITE_API_URL;
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/admin/all-users`, {
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
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
    const response = await fetch(`${API_URL}/api/auth/register`, {
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
    const response = await fetch(`${API_URL}/api/auth/send-otp`, {
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
    
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
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
    
    const response = await fetch(`${API_URL}/api/auth/me`, {
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
