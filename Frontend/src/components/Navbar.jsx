import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiHome, FiUser, FiInfo, FiDollarSign, FiLogIn, FiUserPlus, FiMail } from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector('.menu-content');
      const button = document.querySelector('.menu-button');
      const closeButton = document.querySelector('.close-button');

      if (menu && button && closeButton && 
          !menu.contains(event.target) && 
          !button.contains(event.target) &&
          !closeButton.contains(event.target)) {
        closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
    <div className="relative">
      {/* Menu Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={toggleMenu}
        className="menu-button fixed top-6 left-6 z-50 p-3 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none hover:bg-gray-800/90"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiMenu className={`w-6 h-6 text-gray-100 transition-transform duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100'}`} />
      </motion.button>

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

                {/* Auth Buttons */}
                <div className="mt-12 pt-6 border-t border-gray-700">
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