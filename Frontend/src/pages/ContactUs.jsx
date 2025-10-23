import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeIn } from '../utils/motion';
import Navbar from '../components/Navbar';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiAlertTriangle, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { Input, Button } from 'antd';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    // console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-50 to-white"></div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      >
        <motion.div 
          variants={fadeIn('up', 'tween', 0.1, 1)}  
          className="text-center mb-12 sm:mb-16"
        >
          <motion.span 
            className="inline-flex items-center mb-4 px-4 py-1.5 text-xs font-medium tracking-wider text-blue-600 bg-blue-50 rounded-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <FiAlertTriangle className="mr-2 h-4 w-4" />
            GET IN TOUCH
          </motion.span>
          <motion.h1 
            className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Contact Our Team
          </motion.h1>
          <motion.p 
            className="mt-3 max-w-2xl mx-auto text-sm text-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Have questions or feedback? We're here to help. Reach out to us through the form below or use our contact information.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div
            variants={fadeIn('right', 'tween', 0.2, 1)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  size="large"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  size="large"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  size="large"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 border-none h-11 font-medium text-sm"
                icon={<FiSend className="mr-2" />}
              >
                Send Message
              </Button>
            </form>
          </motion.div>

          <motion.div
            variants={fadeIn('left', 'tween', 0.3, 1)}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
              
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                    <FiPhone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Phone</h4>
                    <p className="text-sm text-gray-600 mt-1">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                    <FiMail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Email</h4>
                    <p className="text-sm text-blue-600 mt-1">info@yourgym.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                    <FiMapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Address</h4>
                    <p className="text-sm text-gray-600 mt-1">123 Fitness Street<br />New York, NY 10001</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Hours</h3>
              <ul className="space-y-3">
                {[
                  { day: 'Monday - Friday', hours: '6:00 AM - 10:00 PM' },
                  { day: 'Saturday', hours: '8:00 AM - 8:00 PM' },
                  { day: 'Sunday', hours: '9:00 AM - 6:00 PM' },
                  { day: 'Holidays', hours: '10:00 AM - 4:00 PM' },
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm"
                  >
                    <span className="font-medium text-gray-700">{item.day}</span>
                    <span className="text-gray-500">{item.hours}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6">
                <Button 
                  type="default"
                  className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300"
                  icon={<FiArrowRight className="transition-transform group-hover:translate-x-1" />}
                >
                  Get Directions
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;