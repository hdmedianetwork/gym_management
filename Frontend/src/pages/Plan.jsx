import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiDollarSign, FiClock, FiZap, FiAward, FiAlertTriangle, FiStar, FiTag } from 'react-icons/fi';
import { createCashfreeSession } from '../utils/payment';
import { getAllPlans, getCouponByCode } from '../utils/api';
import toast from 'react-hot-toast';
import { Input, Button } from 'antd';

// Load Cashfree script
const loadCashfreeScript = () => {
  if (!document.getElementById('cashfree-script')) {
    const script = document.createElement('script');
    script.id = 'cashfree-script';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    document.body.appendChild(script);
  }
};

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
      'Premium facilities'
    ]
  };
  return features[planType.toLowerCase()] || [];
};

const Plan = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [couponCodes, setCouponCodes] = useState({});
  const [appliedCoupons, setAppliedCoupons] = useState({});
  const [applyingCoupon, setApplyingCoupon] = useState({});
  const [couponErrors, setCouponErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const plansData = await getAllPlans();
        
        // Transform API data to match component structure
        const transformedPlans = plansData.map((plan, index) => ({
          _id: plan._id,
          name: `${plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)} Plan`,
          price: plan.amount,
          duration: plan.duration,
          planType: plan.planType,
          features: getPlanFeatures(plan.planType),
          popular: index === 1, // Make the second plan popular
          gradient: index === 1 
            ? 'from-purple-600 to-blue-600' 
            : index % 2 === 0 
              ? 'from-blue-500 to-cyan-400' 
              : 'from-indigo-500 to-purple-500'
        }));

        setPlans(transformedPlans);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
    loadCashfreeScript();
  }, []);

  // Handle coupon application
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
      let finalAmount = plan.price;
      
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((plan.price * parseFloat(coupon.discount)) / 100);
        finalAmount = plan.price - discountAmount;
      } else {
        discountAmount = parseFloat(coupon.discount);
        finalAmount = Math.max(0, plan.price - discountAmount);
      }

      // Store applied coupon data
      setAppliedCoupons(prev => ({
        ...prev,
        [plan._id]: {
          ...coupon,
          discountAmount,
          finalAmount,
          originalAmount: plan.price
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

  // Handle payment initiation
  const handlePayment = async (plan) => {
    try {
      setSelectedPlan(plan);
      setIsPaymentProcessing(true);
      
      const appliedCoupon = appliedCoupons[plan._id];
      const amount = appliedCoupon?.finalAmount || plan.price;

      const paymentData = {
        planId: plan._id,
        planName: plan.name,
        amount: amount,
        duration: plan.duration,
        couponCode: appliedCoupon?.code
      };

      const session = await createCashfreeSession(paymentData);
      
      if (session && window.Cashfree) {
        window.Cashfree(session);
      } else {
        throw new Error('Payment gateway initialization failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a membership plan that fits your fitness goals and start your journey to a healthier you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan._id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative rounded-xl overflow-hidden shadow-lg ${
                plan.popular ? 'ring-2 ring-purple-500 transform -translate-y-2' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-extrabold">₹{plan.price}</span>
                    <span className="ml-1 text-gray-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Billed for {plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                </div>

                {/* Coupon Section */}
                <div className="mb-6">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCodes[plan._id] || ''}
                      onChange={(e) => setCouponCodes(prev => ({
                        ...prev,
                        [plan._id]: e.target.value
                      }))}
                      className={`flex-1 px-3 py-2 border ${
                        couponErrors[plan._id] 
                          ? 'border-red-500' 
                          : appliedCoupons[plan._id] 
                            ? 'border-green-500' 
                            : 'border-gray-300'
                      } rounded-l-md focus:outline-none focus:ring-2 ${
                        couponErrors[plan._id] 
                          ? 'focus:ring-red-500' 
                          : 'focus:ring-purple-500'
                      }`}
                      disabled={!!appliedCoupons[plan._id] && !applyingCoupon[plan._id]}
                    />
                    <button
                      onClick={() => {
                        if (appliedCoupons[plan._id]) {
                          // Remove coupon if already applied
                          setAppliedCoupons(prev => {
                            const newCoupons = {...prev};
                            delete newCoupons[plan._id];
                            return newCoupons;
                          });
                          setCouponCodes(prev => {
                            const newCodes = {...prev};
                            delete newCodes[plan._id];
                            return newCodes;
                          });
                          setCouponErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors[plan._id];
                            return newErrors;
                          });
                          toast.success('Coupon removed');
                        } else {
                          // Apply new coupon
                          handleApplyCoupon(plan);
                        }
                      }}
                      disabled={(!couponCodes[plan._id]?.trim() && !appliedCoupons[plan._id]) || applyingCoupon[plan._id]}
                      className={`px-4 py-2 rounded-r-md font-medium ${
                        appliedCoupons[plan._id] 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                      }`}
                    >
                      {applyingCoupon[plan._id] ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Applying...
                        </span>
                      ) : appliedCoupons[plan._id] ? (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          Remove
                        </span>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  {couponErrors[plan._id] && (
                    <p className="mt-2 text-sm text-red-600">
                      {couponErrors[plan._id]}
                    </p>
                  )}
                  {appliedCoupons[plan._id] && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        Coupon applied! You saved ₹{appliedCoupons[plan._id].discountAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Original: <span className="line-through">₹{appliedCoupons[plan._id].originalAmount.toLocaleString()}</span>
                        {' '}→ Final: <span className="font-semibold">₹{appliedCoupons[plan._id].finalAmount.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan)}
                  disabled={isPaymentProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isPaymentProcessing && selectedPlan?._id === plan._id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Need help choosing the right plan?{' '}
            <button 
              onClick={() => navigate('/contact')}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Contact our team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plan;
