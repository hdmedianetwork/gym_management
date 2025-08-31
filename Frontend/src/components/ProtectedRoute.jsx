import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/api';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        // Check admin flag in localStorage
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Handle admin authentication
  if (requireAuth) {
    // Allow access if user is authenticated or is an admin on admin route
    if (!isAuthenticated && !isAdmin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // If trying to access admin routes, ensure user is admin
    if (location.pathname.startsWith('/admin') && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // If route is auth route (login/signup) but user is authenticated
  if (!requireAuth && (isAuthenticated || isAdmin)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
