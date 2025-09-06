import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileCompletionGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (token && user.id) {
      // If user is logged in but profile is not complete, redirect to profile completion
      if (!user.profileComplete) {
        navigate('/complete-profile');
      }
    }
  }, [navigate]);

  return children;
};

export default ProfileCompletionGuard;