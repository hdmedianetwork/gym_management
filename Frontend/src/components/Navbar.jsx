import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiUser, 
  FiInfo, 
  FiDollarSign, 
  FiLogIn, 
  FiUserPlus, 
  FiMail,
  FiLogOut,
  FiSettings,
  FiCalendar
} from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';
import { useAdmin } from '../context/AdminContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // AdminContext is now available globally
  const adminContext = useAdmin();
  
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdown = (user || isAdmin) && (false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsAdmin(adminStatus);
  }, [location]);

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    
    // Reset state
    setUser(null);
    setIsAdmin(false);
    
    // Close any open menus
    setIsProfileOpen(false);
    setIsOpen(false);
    
    // Redirect to login page with a small delay to ensure state is cleared
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 0);
  };

  // Toggle menu function
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu function
  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector('.menu-content');
      const button = document.querySelector('.menu-button');
      const closeButton = document.querySelector('.close-button');
      const profileMenu = document.querySelector('.profile-menu');
      const profileButton = document.querySelector('.profile-button');

      // Close mobile menu
      if (menu && button && closeButton && 
          !menu.contains(event.target) && 
          !button.contains(event.target) &&
          !closeButton.contains(event.target)) {
        closeMenu();
      }

      // Close profile menu
      if (profileMenu && profileButton && 
          !profileMenu.contains(event.target) && 
          !profileButton.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Navigation links for regular users
  const userNavLinks = [
    { name: 'Home', path: '/', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Contact', path: '/contact', icon: <FiMail className="w-5 h-5" /> },
    { name: 'Plan', path: '/plan', icon: <FiDollarSign className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  // Navigation links for admin users
  const adminNavLinks = [
    { 
      name: 'Dashboard', 
      icon: <FiHome className="w-5 h-5" />,
      path: '/admin'
    },
    
    {
      name: 'Terminated Users',
      icon: <FiX className="w-5 h-5" />,
      path: '/admin/terminated-users'
    },
    { 
      name: 'Branches', 
      icon: <FiHome className="w-5 h-5" />,
      path: '/admin/branches'
    },
    { 
      name: 'Plans', 
      icon: <FiDollarSign className="w-5 h-5" />,
      path: '/admin/plans'
    },
    { 
      name: 'Revenue', 
      icon: <FiDollarSign className="w-5 h-5" />,
      path: '/admin/revenue'
    },
    { 
      name: 'Coupons', 
      icon: <FiCalendar className="w-5 h-5" />,
      path: '/admin/coupons'
    },
    { 
      name: 'Settings', 
      icon: <FiSettings className="w-5 h-5" />,
      path: '/admin/settings'
    },
  ];

  // Common auth links
  const authLinks = [
    { name: 'Sign In', path: '/login', icon: <FiLogIn className="w-5 h-5" /> },
    { name: 'Sign Up', path: '/signup', icon: <FiUserPlus className="w-5 h-5" /> },
  ];

  // Get the appropriate navigation links based on user type
  const getNavLinks = () => {
    if (isAdmin) return adminNavLinks;
    return userNavLinks;
  };

  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  const handleLinkClick = (item) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const menuVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Fixed Sidebar - Always visible on desktop, collapsible on mobile */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white text-gray-900 shadow-lg transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
              <FaDumbbell className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">Gym Pro</span>
            </Link>
            <button
              onClick={closeMenu}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none"
              aria-label="Close sidebar"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {getNavLinks().map((link, index) => (
              <button
                key={link.path || link.name}
                onClick={() => handleLinkClick(link)}
                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
                  link.path && isActive(link.path)
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1'
                }`}
              >
                <span className="mr-3 transition-transform duration-300 group-hover:scale-110">
                  {link.icon}
                </span>
                {link.name}
              </button>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            {user || isAdmin ? (
              <div className="space-y-2">
                <div className="flex items-center px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-300 shadow-sm">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {isAdmin ? (adminContext?.adminEmail || 'Admin') : (user?.email || 'user@example.com')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="group flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-300 ease-in-out hover:shadow-sm hover:-translate-y-0.5"
                >
                  <FiLogOut className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full px-4 py-3 text-sm text-center font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="block w-full px-4 py-3 text-sm text-center font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:shadow-sm hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Top Bar - Only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 focus:outline-none"
            aria-label="Open menu"
          >
            <motion.div
              animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </motion.div>
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <FaDumbbell className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold text-gray-900">Gym Pro</span>
          </Link>
          <div className="w-10"></div>
        </div>
      </div>
    </>
  );
};

export default Navbar;