import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/api';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
        
        if (!token) {
          setIsUserAuthenticated(false);
          setIsAdminAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Check admin authentication first
        if (isAdminFlag) {
          setIsAdminAuthenticated(true);
          setIsUserAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // If not admin, check regular user authentication
        const user = await getCurrentUser();
        if (user) {
          setIsUserAuthenticated(true);
          setIsAdminAuthenticated(false);
        } else {
          setIsUserAuthenticated(false);
          setIsAdminAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsUserAuthenticated(false);
        setIsAdminAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/adminlogin', '/signup', '/forgot-password', '/verify-otp'].includes(location.pathname);

  // Handle authentication required routes
  if (requireAuth) {
    // For admin routes
    if (isAdminRoute) {
      if (!isAdminAuthenticated) {
        return <Navigate to="/adminlogin" state={{ from: location.pathname }} replace />;
      }
      return children;
    }
    // For user routes
    else if (!isUserAuthenticated) {
      return <Navigate to="/login" state={{ from: location.pathname || '/' }} replace />;
    }
  }

  // Handle auth routes (login, signup, adminlogin, etc.)
  if (isAuthRoute) {
    // If trying to access login while already authenticated as user or admin
    if (location.pathname === '/login' && (isUserAuthenticated || isAdminAuthenticated)) {
      return <Navigate to={isAdminAuthenticated ? "/admin" : redirectTo} replace />;
    }
    // If trying to access signup while already authenticated as user or admin
    if (location.pathname === '/signup' && (isUserAuthenticated || isAdminAuthenticated)) {
      return <Navigate to={isAdminAuthenticated ? "/admin" : redirectTo} replace />;
    }
    // If trying to access adminlogin while already authenticated as admin or user
    if (location.pathname === '/adminlogin' && (isAdminAuthenticated || isUserAuthenticated)) {
      return <Navigate to={isAdminAuthenticated ? "/admin" : redirectTo} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
