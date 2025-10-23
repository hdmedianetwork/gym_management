import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
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
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    
    try {
      setIsApplyingCoupon(true);
      const coupon = await getCouponByCode(couponCode);
      
      if (coupon && coupon.isActive) {
        setAppliedCoupon(coupon);
        toast.success(`Coupon applied: ${coupon.discount}% off!`);
      } else {
        toast.error('Invalid or expired coupon code');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Handle payment initiation
  const handlePayment = async (plan) => {
    try {
      setSelectedPlan(plan);
      setIsPaymentProcessing(true);
      
      const amount = appliedCoupon 
        ? plan.price - (plan.price * appliedCoupon.discount / 100)
        : plan.price;

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Perfect Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select a membership plan that fits your fitness goals
          </p>
          
          {selectedPlan && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-r-none"
                  disabled={!!appliedCoupon}
                />
                <Button
                  type="primary"
                  className="rounded-l-none"
                  onClick={handleApplyCoupon}
                  loading={isApplyingCoupon}
                  disabled={!!appliedCoupon}
                >
                  {appliedCoupon ? 'Applied' : 'Apply'}
                </Button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-sm text-green-600">
                  {appliedCoupon.discount}% discount applied!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const finalPrice = appliedCoupon 
              ? plan.price - (plan.price * appliedCoupon.discount / 100)
              : plan.price;
              
            return (
              <div 
                key={plan._id}
                className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-blue-500 transform md:scale-105' : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 transform translate-x-2 -translate-y-2 rounded-bl-lg flex items-center">
                    <FiStar className="mr-1" /> POPULAR
                  </div>
                )}
                
                <div className={`h-2 ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'}`}></div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">₹{finalPrice.toLocaleString('en-IN')}</span>
                      <span className="ml-1 text-gray-500">/ {plan.duration} {plan.duration > 1 ? 'months' : 'month'}</span>
                    </div>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="mb-4 p-2 bg-green-50 text-green-700 text-sm rounded-md flex items-center">
                      <FiTag className="mr-2 flex-shrink-0" />
                      {appliedCoupon.discount}% OFF applied
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={isPaymentProcessing}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-center transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isPaymentProcessing && plan._id === selectedPlan?._id ? (
                      'Processing...'
                    ) : (
                      `Get Started - ₹${finalPrice.toLocaleString('en-IN')}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need help choosing the right plan?</p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Contact Us
            <svg
              className="ml-2 -mr-1 w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Plan;
