import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment_status');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Check if payment was successful
    if (paymentStatus === 'SUCCESS') {
      // Store in localStorage that payment was completed
      localStorage.setItem('paymentCompleted', 'true');
      
      // Show success message
      toast.success('Payment successful! Your subscription is now active.');
    } else if (paymentStatus === 'FAILED') {
      toast.error('Payment failed. Please try again.');
    } else if (paymentStatus === 'CANCELLED') {
      toast.warning('Payment was cancelled.');
    }

    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, paymentStatus, orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {paymentStatus === 'SUCCESS' 
            ? 'Payment Successful!' 
            : paymentStatus === 'FAILED' 
              ? 'Payment Failed' 
              : 'Processing Payment...'}
        </h1>
        <p className="text-gray-600 mb-6">
          {paymentStatus === 'SUCCESS'
            ? 'Thank you for your payment! You will be redirected to the home page shortly.'
            : paymentStatus === 'FAILED'
              ? 'There was an issue processing your payment. Please try again.'
              : 'Please wait while we process your payment...'}
        </p>
        {orderId && (
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentStatus;
