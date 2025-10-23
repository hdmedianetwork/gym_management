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
        const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // For admin routes, we don't need to fetch user data if isAdmin flag is set
        if (location.pathname.startsWith('/admin') && isAdminFlag) {
          setIsAuthenticated(true);
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
        
        // For non-admin routes, fetch user data
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setIsAdmin(user.role === 'admin');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
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
    // Check if it's an admin route
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    // If it's an admin route, check for admin authentication
    if (isAdminRoute) {
      const isAdminAuthenticated = localStorage.getItem('isAdmin') === 'true';
      if (!isAdminAuthenticated) {
        return <Navigate to="/adminlogin" state={{ from: location.pathname }} replace />;
      }
      // If admin is authenticated, allow access to admin routes
      return children;
    } 
    // For non-admin routes, check regular authentication
    else if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location.pathname || '/' }} replace />;
    }
  }

  // If trying to access auth routes while already authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
