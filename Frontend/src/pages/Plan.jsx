import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fadeIn, staggerContainer } from '../utils/motion';
import { createCashfreeSession } from '../utils/payment';
import { getAllPlans, getCouponByCode } from '../utils/api';
import { FiAlertTriangle, FiStar, FiCheckCircle, FiTag } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Input, Button } from 'antd';

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
  const [couponCodes, setCouponCodes] = React.useState({});
  const [appliedCoupons, setAppliedCoupons] = React.useState({});
  const [applyingCoupon, setApplyingCoupon] = React.useState({});
  const [couponErrors, setCouponErrors] = React.useState({});
  const [latestPayment, setLatestPayment] = React.useState(null);
  const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsBannerVisible(false);
      // Remove from DOM after animation completes
      setTimeout(() => setShowInitialBanner(false), 300);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Fetch latest payment for current user by email
  const fetchLatestPayment = async (email) => {
    try {
      setIsLoadingPayment(true);
      if (!email) return;

      // Import here to avoid circular imports in case of refactors
      const { getSuccessfulPayments } = await import('../utils/api');
      const raw = await getSuccessfulPayments();
      console.log('[Home] getSuccessfulPayments raw type:', Array.isArray(raw) ? 'array' : typeof raw);
      console.log('[Home] getSuccessfulPayments raw value:', raw);

      // Normalize API response to an array
      const paymentsArray = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.transactions)
          ? raw.transactions
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.payments)
              ? raw.payments
              : Array.isArray(raw?.results)
                ? raw.results
                : [];
      console.log('[Home] Normalized paymentsArray length:', paymentsArray.length);
      try {
        console.log('[Home] First item keys:', paymentsArray[0] ? Object.keys(paymentsArray[0]) : 'N/A');
        console.log('[Home] First item.customerDetails:', paymentsArray[0]?.customerDetails);
        const getEmailForLog = (p) => (
          p?.email || p?.customerEmail || p?.user?.email || p?.customerDetails?.customerEmail || p?.customerDetails?.customer_email || p?.cashfreeData?.customer_details?.customer_email || null
        );
        const detectedEmails = paymentsArray.map(p => getEmailForLog(p)).filter(Boolean);
        console.log('[Home] Sample detected emails (first 20):', detectedEmails.slice(0, 20));
        const firstThreeDiagnostics = paymentsArray.slice(0,3).map((p, idx) => ({
          idx,
          customerDetails: p?.customerDetails,
          computedEmail: getEmailForLog(p),
        }));
        console.log('[Home] First three items diagnostics:', firstThreeDiagnostics);
      } catch (e) {
        console.log('[Home] Could not list detected emails:', e);
      }

      // Helper to extract email from various shapes
      const getPaymentEmail = (p) =>
        (
          p.email ||
          p.customerEmail ||
          p.user?.email ||
          p.customerDetails?.customerEmail ||
          p.customerDetails?.customer_email ||
          p.cashfreeData?.customer_details?.customer_email ||
          ''
        ).toLowerCase();

      // Filter by email (various possible fields)
      const targetEmail = String(email).trim().toLowerCase();
      console.log('[Home] Target email for filtering (trimmed):', targetEmail);
      const filteredByEmail = paymentsArray.filter(p => {
        const e = getPaymentEmail(p);
        return e && e.trim().toLowerCase() === targetEmail;
      });
      console.log('[Home] Filtered by email count:', filteredByEmail.length);
      let byString = [];
      if (filteredByEmail.length === 0) {
        // Broad substring search across objects for troubleshooting
        byString = paymentsArray.filter(p => {
          try { return JSON.stringify(p).toLowerCase().includes(targetEmail); } catch { return false; }
        });
        console.log('[Home] Fallback substring search count:', byString.length);
        if (byString.length > 0) {
          console.log('[Home] Example of substring match item:', byString[0]);
        }
      }

      // Fallback: try matching by phone if email yielded 0
      let filteredPrimary = filteredByEmail.length > 0 ? filteredByEmail : byString;
      if (filteredPrimary.length === 0) {
        // Final fallback: recursively inspect values to see if any string equals the email exactly
        const looksLikeEmail = (s) => typeof s === 'string' && s.toLowerCase() === targetEmail;
        const containsEmailDeep = (obj, depth = 0) => {
          if (!obj || depth > 5) return false;
          if (looksLikeEmail(obj)) return true;
          if (typeof obj === 'object') {
            for (const k in obj) {
              if (containsEmailDeep(obj[k], depth + 1)) return true;
            }
          }
          return false;
        };
        const byDeep = paymentsArray.filter(p => containsEmailDeep(p));
        console.log('[Home] Deep search fallback count:', byDeep.length);
        if (byDeep.length > 0) filteredPrimary = byDeep;
      }
      if (filteredPrimary.length === 0 && user?.mobile) {
        const targetPhone = String(user.mobile).trim();
        const getPhone = (p) => (
          p?.customerPhone || p?.phone || p?.customerDetails?.customerPhone || p?.customerDetails?.customer_phone || p?.cashfreeData?.customer_details?.customer_phone || null
        );
        const byPhone = paymentsArray.filter(p => {
          const ph = getPhone(p);
          return ph && String(ph).trim() === targetPhone;
        });
        console.log('[Home] Fallback filter by phone. targetPhone:', targetPhone, 'count:', byPhone.length);
        if (byPhone.length > 0) filteredPrimary = byPhone;
      }

      // From schema, successful orders have orderStatus: 'PAID'
      const filtered = filteredPrimary.filter(p => String(p.orderStatus || p.paymentStatus || '').toUpperCase() === 'PAID');
      console.log('[Home] Filtered by email + PAID count:', filtered.length);
      if (filtered.length === 0) {
        // Log a few entries to help diagnose
        console.log('[Home] No PAID payments matched. First primary-matched item (if any):', filteredPrimary[0]);
      }

      if (filtered.length === 0) {
        setLatestPayment(null);
        return;
      }

      // Helper to safely parse different date formats (Date, ISO, BSON-like)
      const parseDateVal = (val) => {
        try {
          if (!val) return 0;
          if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime();
          if (val?.$date) {
            const inner = val.$date;
            if (typeof inner === 'string' || typeof inner === 'number') return new Date(inner).getTime();
            if (inner?.$numberLong) return Number(inner.$numberLong);
          }
          return new Date(val).getTime();
        } catch { return 0; }
      };

      // Sort by date desc using paymentCompletedAt > createdAt > cashfreeData.created_at
      const getDate = (p) => {
        return (
          parseDateVal(p.paymentCompletedAt) ||
          parseDateVal(p.createdAt) ||
          parseDateVal(p.cashfreeData?.created_at) ||
          parseDateVal(p.updatedAt) ||
          parseDateVal(p.date)
        );
      };
      filtered.sort((a, b) => getDate(b) - getDate(a));
      const latest = filtered[0];
      console.log('[Home] Latest matched payment object:', latest);

      // Extract numeric amount from various shapes (including BSON-like)
      const extractAmount = (v) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return Number(v) || 0;
        if (v.$numberInt) return Number(v.$numberInt) || 0;
        if (v.$numberDouble) return Number(v.$numberDouble) || 0;
        if (v.$numberDecimal) return Number(v.$numberDecimal) || 0;
        return Number(v) || 0;
      };

      // Build a compact object for UI
      setLatestPayment({
        planName: latest.planName || latest.plan?.name || latest.planType || latest.databaseInfo?.planType || 'Gym Membership',
        amount: latest.amount || latest.planAmount || latest.databaseInfo?.planAmount || extractAmount(latest.orderAmount) || extractAmount(latest.cashfreeData?.order_amount) || 0,
        paymentDate: (parseDateVal(latest.paymentCompletedAt) || parseDateVal(latest.createdAt) || parseDateVal(latest.cashfreeData?.created_at)) || null,
        // Ensure duration supports BSON-like numeric shapes and include DB fallback
        duration: extractAmount(latest.planDuration || latest.plan?.duration || latest.databaseInfo?.planDuration),
        paymentId: latest.orderId || latest.paymentId || latest._id || 'N/A',
        status: latest.orderStatus || latest.status || latest.paymentStatus || latest.cashfreeData?.order_status || 'PAID'
      });
    } catch (err) {
      console.error('[Home] Failed to fetch latest payment:', err);
      setLatestPayment(null);
    } finally {
      setIsLoadingPayment(false);
    }
  };

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
    // Detect admin session
    setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    loadCashfreeScript();
  }, []);

  // When user is available, fetch their latest payment
  React.useEffect(() => {
    if (user?.email) {
      const trimmedEmail = String(user.email).trim();
      console.log('[Home] Triggering fetchLatestPayment for email (trimmed):', trimmedEmail);
      fetchLatestPayment(trimmedEmail);
    } else {
      console.log('[Home] No user email found on mount. user:', user);
    }
  }, [user?.email]);

  const handleApplyCoupon = async (plan) => {
    const couponCode = couponCodes[plan._id];
    if (!couponCode || !couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(prev => ({ ...prev, [plan._id]: true }));
    setCouponErrors(prev => ({ ...prev, [plan._id]: null }));

    try {
      const coupon = await getCouponByCode(couponCode.trim().toUpperCase());
      
      // Calculate discount
      let discountAmount = 0;
      let finalAmount = plan.amount;
      
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((plan.amount * parseFloat(coupon.discount)) / 100);
        finalAmount = plan.amount - discountAmount;
      } else {
        discountAmount = parseFloat(coupon.discount);
        finalAmount = Math.max(0, plan.amount - discountAmount);
      }

      // Store applied coupon data
      setAppliedCoupons(prev => ({
        ...prev,
        [plan._id]: {
          ...coupon,
          discountAmount,
          finalAmount,
          originalAmount: plan.amount
        }
      }));

      toast.success(`Coupon applied! You saved ₹${discountAmount.toLocaleString()}`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponErrors(prev => ({ 
        ...prev, 
        [plan._id]: error.message || 'Invalid or expired coupon code' 
      }));
      toast.error('Invalid or expired coupon code');
    } finally {
      setApplyingCoupon(prev => ({ ...prev, [plan._id]: false }));
    }
  };

  const handleRemoveCoupon = (plan) => {
    setAppliedCoupons(prev => {
      const newState = { ...prev };
      delete newState[plan._id];
      return newState;
    });
    setCouponCodes(prev => ({ ...prev, [plan._id]: '' }));
    setCouponErrors(prev => ({ ...prev, [plan._id]: null }));
    toast.success('Coupon removed');
  };

  const handleGetStarted = async (plan) => {
    const appliedCoupon = appliedCoupons[plan._id];
    const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : plan.amount;
    const couponCode = appliedCoupon ? appliedCoupon.code : '';
    
    await processSubscription({ ...plan, amount: finalAmount }, couponCode);
  };

  const processSubscription = async (plan, coupon = '') => {
    if (!user) {
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
            couponCode: coupon || ''
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
                      
                      {/* Coupon Section */}
                      {!appliedCoupons[plan._id] ? (
                        <div className="mt-6 mb-4">
                          <div className="flex items-center gap-1">
                            <Input
                              prefix={<FiTag className="text-gray-400" />}
                              placeholder="Coupon code"
                              value={couponCodes[plan._id] || ''}
                              onChange={(e) => setCouponCodes(prev => ({
                                ...prev,
                                [plan._id]: e.target.value.toUpperCase()
                              }))}
                              className="flex-1"
                              size="large"
                              onPressEnter={() => handleApplyCoupon(plan)}
                              status={couponErrors[plan._id] ? 'error' : ''}
                            />
                            <Button
                              type="primary"
                              size="large"
                              onClick={() => handleApplyCoupon(plan)}
                              loading={applyingCoupon[plan._id]}
                              disabled={!couponCodes[plan._id]?.trim()}
                              className="h-10 px-4"
                            >
                              Apply
                            </Button>
                          </div>
                          {couponErrors[plan._id] && (
                            <p className="mt-1 text-xs text-red-500 text-center">
                              {couponErrors[plan._id]}
                            </p>
                          )}
                          {!couponErrors[plan._id] && (
                            <p className="mt-1 text-xs text-gray-400 text-center">
                              Enter coupon code if you have one
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FiCheckCircle className="text-green-600 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  {appliedCoupons[plan._id].code} Applied
                                </p>
                                <p className="text-xs text-green-600">
                                  You saved ₹{appliedCoupons[plan._id].discountAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCoupon(plan)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Updated Price Display */}
                      {appliedCoupons[plan._id] && (
                        <div className="mb-6">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-medium text-gray-400 line-through">
                              ₹{plan.amount.toLocaleString()}
                            </span>
                            <span className="text-3xl font-bold text-green-600">
                              ₹{appliedCoupons[plan._id].finalAmount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-green-600 text-center mt-1">
                            {appliedCoupons[plan._id].discountType === 'percentage' 
                              ? `${appliedCoupons[plan._id].discount}% discount applied`
                              : `₹${appliedCoupons[plan._id].discount} discount applied`
                            }
                          </p>
                        </div>
                      )}
                      
                      <motion.div 
                        className="mt-4"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => handleGetStarted(plan)}
                          loading={selectedPlan === plan}
                          disabled={selectedPlan === plan}
                          className={`w-full h-auto py-3.5 px-6 rounded-xl font-medium transition-all duration-300 ${
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
                        </Button>
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