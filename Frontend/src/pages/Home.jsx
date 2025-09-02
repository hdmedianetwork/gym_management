import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fadeIn, staggerContainer } from '../utils/motion';
import { createCashfreeSession } from '../utils/payment';
import { getAllPlans } from '../utils/api';
import { FiAlertTriangle, FiStar, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

// Cashfree script loader (v3)
const loadCashfreeScript = () => {
  if (!document.getElementById('cashfree-script')) {
    const script = document.createElement('script');
    script.id = 'cashfree-script';
    // Use v3 SDK per Cashfree docs
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [plans, setPlans] = React.useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(true);
  const [plansError, setPlansError] = React.useState(null);

  // Helper function to get plan features based on plan type
  const getPlanFeatures = (planType) => {
    const features = {
      basic: [
        'Access to gym floor',
        'Standard equipment',
        'Locker room access',
        '1 Free Training'
      ],
      standard: [
        'All Basic features',
        'Group classes',
        'Sauna access',
        '3 Free Trainings',
        'Nutrition plan'
      ],
      premium: [
        'All Standard features',
        '24/7 Access',
        'Personal trainer',
        'Unlimited classes',
        'Massage chair access',
        'Elite locker'
      ]
    };
    return features[planType.toLowerCase()] || [];
  };

  // Helper function to get plan styling based on plan type
  const getPlanStyling = (planType, index) => {
    const styling = {
      basic: {
        gradient: 'from-blue-500 to-cyan-400',
        popular: false
      },
      standard: {
        gradient: 'from-purple-600 to-pink-500',
        popular: true
      },
      premium: {
        gradient: 'from-amber-500 to-orange-500',
        popular: false
      }
    };
    return styling[planType.toLowerCase()] || {
      gradient: 'from-gray-500 to-gray-600',
      popular: index === 1 // Make middle plan popular by default
    };
  };

  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [showInitialBanner, setShowInitialBanner] = React.useState(true);
  const [isBannerVisible, setIsBannerVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsBannerVisible(false);
      // Remove from DOM after animation completes
      setTimeout(() => setShowInitialBanner(false), 300);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Fetch plans from API
  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        setPlansError(null);
        const plansData = await getAllPlans();
        
        // Transform API data to match component structure
        const transformedPlans = plansData.map((plan, index) => {
          const styling = getPlanStyling(plan.planType, index);
          return {
            _id: plan._id,
            name: `${plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)} Plan`,
            price: `₹${plan.amount.toLocaleString('en-IN')}`,
            amount: plan.amount,
            duration: plan.duration,
            period: plan.duration > 1 ? `/${plan.duration} months` : '/month',
            features: getPlanFeatures(plan.planType),
            popular: styling.popular,
            gradient: styling.gradient,
            planType: plan.planType
          };
        });
        
        setPlans(transformedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlansError('Failed to load plans. Please refresh the page.');
        // Fallback to default plans if API fails
        setPlans([
          {
            name: 'Basic Plan',
            price: '₹999',
            amount: 999,
            duration: 1,
            period: '/month',
            features: getPlanFeatures('basic'),
            popular: false,
            gradient: 'from-blue-500 to-cyan-400',
            planType: 'basic'
          }
        ]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  React.useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCashfreeScript();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) {
      // Not authenticated, redirect to login
      navigate('/login');
      return;
    }
    
    // Clear any previous payment status
    localStorage.removeItem('paymentCompleted');
    
    setSelectedPlan(plan);
    
    // Load Cashfree script if not already loaded
    loadCashfreeScript();

    // Wait for Cashfree v2 to be available
    const started = Date.now();
    const iv = setInterval(async () => {
      if (typeof window.Cashfree === 'function') {
        clearInterval(iv);
        try {
          // Create payment session from local backend
          const orderId = 'order_' + Date.now();
          const orderAmount = plan.amount; // Use the numeric amount directly
          const customerName = user?.name || 'Guest User';
          const customerEmail = user?.email || 'guest@example.com';
          const customerPhone = user?.mobile || '9999999999';
          const returnUrl = window.location.origin + '/payment-status';

          const { paymentSessionId } = await createCashfreeSession({
            orderId,
            orderAmount,
            customerName,
            customerEmail,
            customerPhone,
            returnUrl,
            planType: plan.planType || plan.name, // Include plan type
            planAmount: plan.amount, // Include plan amount
            planDuration: plan.duration || 1, // Include plan duration
          });

          if (!paymentSessionId) throw new Error('No paymentSessionId received');

          // v3 initialization (function, not class)
          const cashfree = window.Cashfree({ mode: 'sandbox' });
          await cashfree.checkout({
            paymentSessionId,
            redirectTarget: '_self',
            onSuccess: () => {
              // Set payment as completed in localStorage
              localStorage.setItem('paymentCompleted', 'true');
              setIsSubscribed(true);
              setSelectedPlan(null);
              toast.success('Payment successful! Your subscription is now active.');
              // Redirect to home after successful payment
              navigate('/');
            },
            onFailure: (data) => {
              setSelectedPlan(null);
              toast.error('Payment failed! ' + (data?.message || ''));
            },
          });
        } catch (error) {
          console.error('Cashfree v2 error:', error);
          setSelectedPlan(null);
          toast.error(error?.message || 'Payment service is currently unavailable. Please try again later.');
        }
      } else if (Date.now() - started > 8000) {
        clearInterval(iv);
        setSelectedPlan(null);
        toast.error('Payment service is currently unavailable. Please try again later.');
      }
    }, 100);
  };

  // Prevent all scrolling by adding a class to the HTML element
  React.useEffect(() => {
    // Add class to html element
    document.documentElement.classList.add('no-scroll');
    
    // Cleanup function to remove the class when component unmounts
    return () => {
      document.documentElement.classList.remove('no-scroll');
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 overflow-hidden">
      <Navbar />
      
      {/* Welcome Section */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900 to-blue-900 py-8 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {user.name || 'Valued Member'}!
                </h1>
                <p className="mt-2 text-purple-200">
                  {user.mobile ? `Mobile: ${user.mobile}` : 'Thank you for joining us!'}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-200/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')] opacity-5 mix-blend-overlay"></div>
        
        {/* Animated dots */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gray-800"
              style={{
                width: Math.random() * 6 + 2 + 'px',
                height: Math.random() * 6 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 5,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-hidden">
        {/* Pricing Section */}
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <motion.div 
            className="text-center mb-16 sm:mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.span 
              className="inline-block mb-4 px-4 py-1.5 text-xs sm:text-sm font-medium tracking-wider text-gray-600 bg-gray-100 rounded-full border border-gray-200"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              FLEXIBLE MEMBERSHIPS
            </motion.span>
            <motion.h1 
              className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="text-gray-900">Perfect Plan</span>
            </motion.h1>
            <motion.p 
              className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Select the membership that matches your fitness goals. All plans include access to our premium facilities and expert trainers.
            </motion.p>
          </motion.div>

          {/* Error Message */}
          {plansError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <FiAlertTriangle className="text-red-500 mr-2" />
                <span className="text-red-700">{plansError}</span>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="h-1.5 bg-gray-100"></div>
                  <div className="p-6 sm:p-8 animate-pulse">
                    <div className="text-center">
                      <div className="h-6 bg-gray-200 rounded mb-8"></div>
                      <div className="mb-10">
                        <div className="h-12 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-3 mb-10">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Pricing Cards */
            <div id="plans" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
              <motion.div 
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.1 * index, 
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{ y: -8 }}
                className={`relative group ${plan.popular ? 'lg:-mt-4' : ''}`}
              >
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-gray-900 text-white">
                      <FiStar className="mr-1.5" /> Most Popular
                    </span>
                  </motion.div>
                )}
                
                <div className={`h-full bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl ${
                  plan.popular 
                    ? 'ring-1 ring-gray-300 shadow-lg' 
                    : 'hover:ring-1 hover:ring-gray-200'
                }`}>
                  <div className="h-1.5 bg-gray-100 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'linear',
                      }}
                    />
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      
                      <motion.div 
                        className="mt-8 mb-10"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-baseline">
                            <span className="text-3xl sm:text-4xl font-medium text-gray-300 mr-1.5">₹</span>
                            <span className="text-5xl sm:text-6xl font-bold text-gray-900">
                              {plan.price.replace('₹', '').replace(',', '')}
                            </span>
                            <span className="text-xl font-medium text-gray-400 ml-1.5">
                              {plan.duration > 1 ? `/${plan.duration}mo` : '/month'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-400 mt-3">
                            {plan.duration > 1 ? `billed for ${plan.duration} months` : 'billed monthly'}
                          </span>
                        </div>
                      </motion.div>
                      
                      <ul className="space-y-3.5 text-left mb-10">
                        {plan.features.map((feature, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start group"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              delay: 0.5 + (i * 0.05),
                              type: 'spring',
                              stiffness: 300
                            }}
                          >
                            <motion.div 
                              className="flex-shrink-0 mt-1"
                              whileHover={{ scale: 1.2, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 500 }}
                            >
                              <svg 
                                className={`h-5 w-5 ${plan.popular ? 'text-gray-900' : 'text-gray-600'}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                            <span className="ml-3 text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                      
                      <motion.div 
                        className="mt-8"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={selectedPlan === plan}
                          className={`w-full py-3.5 px-6 rounded-xl font-medium transition-all duration-300 ${
                            selectedPlan === plan
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : plan.popular 
                                ? 'bg-gray-900 text-white hover:bg-gray-800' 
                                : 'bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {selectedPlan === plan ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <FiCheckCircle className="mr-2" />
                              Get Started
                            </span>
                          )}
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            className="mt-16 text-center text-sm text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
              <p>Need help choosing the right plan?{' '}
                <button 
                  onClick={() => navigate('/contact')}
                  className="text-gray-900 hover:text-gray-700 cursor-pointer font-medium group transition-colors duration-200 border-b border-gray-400 pb-0.5 focus:outline-none"
                >
                  Contact our team
                  <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 pt-16">
        {/* Your page content goes here */}
      </div>
    </div>
  );
};

export default Home;