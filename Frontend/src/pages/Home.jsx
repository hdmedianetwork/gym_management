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

  // Removed the no-scroll effect to allow natural page scrolling

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
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
            </div>
          </div>
        </motion.div>
      )}

      {/* Membership Summary (hidden for admin) */}
      {!isAdmin && user && (
        <div className="w-full">
          {isLoadingPayment ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading your membership details...</p>
            </div>
          ) : latestPayment ? (
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                    Welcome to Your Membership
                  </h1>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Manage your fitness journey with us
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-10 max-w-5xl mx-auto pointer-events-auto">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {latestPayment.planName || 'Gym Membership'}
                        </h2>
                        {latestPayment.status && (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                            {String(latestPayment.status).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium">Member since:</span>{' '}
                        {latestPayment.paymentDate ? new Date(latestPayment.paymentDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Linked to {user.email}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl text-center min-w-[200px]">
                      <p className="text-sm font-medium mb-1">Current Plan</p>
                      <p className="text-3xl font-bold">
                        ₹{Number(latestPayment.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm opacity-90">
                        for {latestPayment.duration || 1} {latestPayment.duration > 1 ? 'months' : 'month'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {/* Payment ID Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Payment ID</h3>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 break-all">
                        {latestPayment.paymentId || 'N/A'}
                      </p>
                    </div>

                    {/* Membership Type Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Membership Type</h3>
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {latestPayment.planName || 'Standard Membership'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Active</p>
                    </div>

                    {/* Billing Cycle Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Billing Cycle</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {latestPayment.duration || 1} {latestPayment.duration > 1 ? 'Months' : 'Month'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {latestPayment.paymentDate ? `Started ${new Date(latestPayment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Start date not available'}
                      </p>
                    </div>

                    {/* Next Billing Date Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Next Billing</h3>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      {latestPayment.paymentDate && latestPayment.duration ? (
                        <>
                          <p className="text-lg font-semibold text-gray-900">
                            {(() => {
                              const nextDate = new Date(latestPayment.paymentDate);
                              nextDate.setMonth(nextDate.getMonth() + (parseInt(latestPayment.duration) || 1));
                              return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            })()}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {(() => {
                              const today = new Date();
                              const nextDate = new Date(latestPayment.paymentDate);
                              nextDate.setMonth(nextDate.getMonth() + (parseInt(latestPayment.duration) || 1));
                              const diffTime = nextDate - today;
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays > 0 ? `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}` : 'Due now';
                            })()}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-500">Not available</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Upgrade Plan clicked');
                        navigate('/plan');
                      }}
                      className="flex-1 max-w-xs flex items-center justify-center gap-2 border-2 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      Upgrade Plan
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Get Help clicked');
                        navigate('/contact');
                      }}
                      className="flex-1 max-w-xs flex items-center justify-center gap-2 border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Get Help
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto px-4 py-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <FiCheckCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
                <p className="text-xl text-gray-600 mb-8">
                  You don't have an active membership yet. Choose a plan that fits your fitness goals and start your journey with us today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/plan')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 text-lg"
                  >
                    View Membership Plans
                  </button>
                  <button
                    onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition-all duration-200 text-lg"
                  >
                    Learn More
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
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
      <div id="plans" className="relative z-10 flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* View Plans Section */}
          {!latestPayment && !isLoadingPayment && user && !isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-12">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Join Our Gym?</h2>
                <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
                  Join our community of fitness enthusiasts and get access to state-of-the-art equipment, 
                  expert trainers, and a variety of classes designed to help you reach your fitness goals.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mt-10">
                  {[ 
                    { 
                      icon: '🏋️', 
                      title: 'Modern Equipment', 
                      description: 'Access to the latest fitness equipment and facilities' 
                    },
                    { 
                      icon: '👨‍🏫', 
                      title: 'Expert Trainers', 
                      description: 'Certified trainers to guide you through your fitness journey' 
                    },
                    { 
                      icon: '🧘', 
                      title: 'Group Classes', 
                      description: 'Wide variety of classes for all fitness levels' 
                    }
                  ].map((feature, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 p-6 rounded-xl text-center"
                    >
                      <div className="text-4xl mb-3">{feature.icon}</div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to start your fitness journey?</h3>
                  <p className="text-gray-600 mb-6">Choose a membership plan that works for you</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => navigate('/plan')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      View Membership Plans
                    </button>
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium py-2 px-8 rounded-lg transition-all duration-200"
                    >
                      Back to Top
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - This will be pushed to the bottom */}
      <footer className="bg-gradient-to-br from-gray-100 text-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Gym Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;