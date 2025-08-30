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

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    setIsProfileOpen(false);
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

  const navLinks = [
    { name: 'Home', path: '/', icon: <FiHome className="w-6 h-6" /> },
    { name: 'Services', path: '/services', icon: <FaDumbbell className="w-5 h-5" /> },
    { name: 'Pricing', path: '/pricing', icon: <FiDollarSign className="w-6 h-6" /> },
    { name: 'About', path: '/about', icon: <FiInfo className="w-6 h-6" /> },
    { name: 'Admin', path: '/admin', icon: <FiUser className="w-6 h-6" /> },
    { name: 'Contact', path: '/contact', icon: <FiMail className="w-6 h-6" /> },
  ];

  const authLinks = [
    { name: 'Sign In', path: '/login', icon: <FiLogIn className="w-5 h-5" /> },
    { name: 'Sign Up', path: '/signup', icon: <FiUserPlus className="w-5 h-5" /> },
  ];

  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  const handleLinkClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const menuVariants = {
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: '-100%',
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
      WebkitBackdropFilter: 'blur(8px)'
    },
    exit: { 
      opacity: 0,
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)'
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Menu Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleMenu}
            className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiMenu className="w-6 h-6" />
          </motion.button>

          {/* Logo */}
          <Link to="/home" className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white">Gym Management</h1>
          </Link>

          {/* Profile Section */}
          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-300 hidden md:inline">
                    {user.name || 'Profile'}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="menu"
                  >
                    <div className="py-1" role="none">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiUser className="mr-2" /> Your Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiSettings className="mr-2" /> Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        role="menuitem"
                      >
                        <FiLogOut className="mr-2" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Blurred Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Full-screen Menu */}
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="menu-content fixed top-0 left-0 w-full h-screen bg-black text-white z-50 overflow-y-auto py-6 px-8 shadow-2xl"
            >
              {/* Close Button */}
              <motion.button
                onClick={closeMenu}
                className="close-button fixed top-6 right-6 z-50 p-3 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none hover:bg-gray-700/90"
                aria-label="Close menu"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX className="w-6 h-6 text-gray-100" />
              </motion.button>
              <div className="container mx-auto h-full flex flex-col">
                {/* Logo */}
                <div className="mb-12">
                  <Link 
                    to="/" 
                    className="text-3xl font-bold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    GymFit Pro
                  </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 flex flex-col justify-center space-y-4">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        transition: { delay: 0.1 * index }
                      }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => handleLinkClick(link.path)}
                        className={`flex items-center px-6 py-4 rounded-xl text-xl font-medium transition-all ${
                          isActive(link.path) 
                            ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border-l-4 border-indigo-400' 
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                        }`}
                      >
                        <span className="mr-3">{link.icon}</span>
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Auth Buttons or User Profile */}
                <div className="mt-12 pt-6 border-t border-gray-700">
                  {user ? (
                    <div className="space-y-4">
                      {/* User Profile */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: 0.1,
                            type: 'spring',
                            stiffness: 300
                          }
                        }}
                        className="flex items-center px-6 py-4 rounded-xl bg-gray-800/50"
                      >
                        <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                          <FiUser className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name || 'User'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </motion.div>

                      {/* Profile Links */}
                      {[
                        { name: 'Your Profile', path: '/profile', icon: <FiUser className="w-5 h-5" /> },
                        { name: 'Settings', path: '/settings', icon: <FiSettings className="w-5 h-5" /> },
                        { name: 'Sign Out', action: handleLogout, icon: <FiLogOut className="w-5 h-5" /> }
                      ].map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: 0.1 * (index + 1) + 0.3,
                              type: 'spring',
                              stiffness: 300
                            }
                          }}
                        >
                          <button
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else {
                                handleLinkClick(item.path);
                              }
                            }}
                            className="w-full flex items-center px-6 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all"
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {authLinks.map((link, index) => (
                        <motion.div
                          key={link.path}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: 0.1 * index + 0.3,
                              type: 'spring',
                              stiffness: 300
                            }
                          }}
                        >
                          <button
                            onClick={() => handleLinkClick(link.path)}
                            className={`w-full flex items-center justify-center px-6 py-4 rounded-xl text-lg font-medium transition-all ${
                              link.name === 'Sign Up'
                                ? 'bg-white text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:shadow-white/10'
                                : 'border-2 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white'
                            }`}
                          >
                            {link.icon}
                            <span className="ml-2">{link.name}</span>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;