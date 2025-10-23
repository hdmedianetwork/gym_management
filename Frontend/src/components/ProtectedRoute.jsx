import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/api';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }
        
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setIsAdmin(user.role === 'admin');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]); // Re-run when route changes

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // For routes that require authentication
  if (requireAuth) {
    // If not authenticated, redirect to login
    if (!isAuthenticated && !isAdmin) {
      return <Navigate to="/login" state={{ from: location.pathname || '/' }} replace />;
    }
    
    // If trying to access admin routes, ensure user is admin
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // If trying to access auth routes while already authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
