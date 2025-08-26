import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer } from '../utils/motion';

const Home = () => {
  const plans = [
    {
      name: 'Basic',
      price: '₹999',
      period: '/month',
      features: [
        'Access to gym floor',
        'Standard equipment',
        'Locker room access',
        '1 Free Training'
      ],
      popular: false,
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      name: 'Standard',
      price: '₹1,999',
      period: '/month',
      features: [
        'All Basic features',
        'Group classes',
        'Sauna access',
        '3 Free Trainings',
        'Nutrition plan'
      ],
      popular: true,
      gradient: 'from-purple-600 to-pink-500'
    },
    {
      name: 'Premium',
      price: '₹2,999',
      period: '/month',
      features: [
        'All Standard features',
        '24/7 Access',
        'Personal trainer',
        'Unlimited classes',
        'Massage chair access',
        'Premium locker'
      ],
      popular: false,
      gradient: 'from-amber-500 to-orange-500'
    }
  ];

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

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    // In a real app, you would handle the subscription logic here
    setTimeout(() => {
      setIsSubscribed(true);
      setSelectedPlan(null);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-4 sm:pt-6 md:pt-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden"
    >
      {showInitialBanner && !isSubscribed && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={isBannerVisible ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full max-w-4xl mx-auto bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl p-4 sm:p-6 mb-8 sm:mb-12 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">No Active Subscription</h3>
                <p className="text-sm opacity-90">Subscribe to any plan below to unlock all premium features and start your fitness journey today!</p>
              </div>
            </div>
            <button 
              onClick={() => window.scrollTo({ top: document.getElementById('plans').offsetTop - 100, behavior: 'smooth' })}
              className="mt-4 sm:mt-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              View Plans
            </button>
          </div>
        </motion.div>
      )}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent opacity-30"></div>
      </div>
      
      <motion.div 
        variants={staggerContainer}
        className="relative max-w-7xl mx-auto"
      >
        <motion.div 
          variants={fadeIn('up', 'tween', 0.1, 1)}
          className="text-center mb-20"
        >
          <span className="inline-block mb-4 px-4 py-1.5 text-sm font-semibold bg-white/10 backdrop-blur-sm rounded-full text-cyan-400">
            PRICING PLANS
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400 sm:text-5xl lg:text-4xl">
            Membership Plans
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
            Choose the perfect plan that fits your fitness journey. All plans include access to our premium facilities and expert trainers.
          </p>
        </motion.div>

        <div id="plans" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className={`relative group ${plan.popular ? 'md:-mt-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className={`h-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-${plan.gradient.split('-')[1]}-400/50 ${
                plan.popular ? 'ring-2 ring-purple-500/30' : ''
              }`}>
                <div className={`h-2 bg-gradient-to-r ${plan.gradient}`}></div>
                
                <div className="p-5 sm:p-6 md:p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <div className="mt-6 sm:mt-8 mb-8 sm:mb-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-end">
                          <span className="text-3xl sm:text-4xl font-medium text-gray-300 mr-0.5">₹</span>
                          <span className="text-5xl sm:text-4xl  text-white">
                            {plan.price.replace('₹', '').replace(',', '')}
                          </span>
                          <span className="text-xl sm:text-2xl font-medium text-gray-300 mb-1 sm:mb-1.5 ml-0.5 sm:ml-1">/month</span>
                        </div>
                        <span className="text-sm font-medium text-gray-400 mt-3">billed monthly</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-left">
                      {plan.features.map((feature, i) => (
                        <motion.li 
                          key={i} 
                          className="flex items-start"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (i * 0.05) }}
                        >
                          <svg 
                            className={`h-5 w-5 mt-0.5 flex-shrink-0 text-${plan.gradient.split('-')[1]}-400`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          <span className="ml-3 text-gray-300">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSubscribe(plan)}
                      disabled={selectedPlan === plan}
                      className={`mt-10 w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                        selectedPlan === plan
                          ? 'bg-gray-500 cursor-not-allowed'
                          : plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
                            : 'bg-gray-700 hover:bg-gray-600'
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
                      ) : 'Get Started'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16 text-center text-sm text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p>Need help choosing the right plan? <a href="#" className="text-cyan-400 hover:text-cyan-300 font-medium">Contact our team</a></p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Home;