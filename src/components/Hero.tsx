import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import LoginForm from './auth/LoginForm';
import SignUpForm from './auth/SignUpForm';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Play, MapPin, BarChart3, Users, Shield, Check, MessageCircle } from 'lucide-react';

export default function Hero() {
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  // Animation refs
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (!currentUser) {
      setShowSignUpModal(true);
    }
  };

  // Text animation variants
  const headingVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  const paragraphVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        delay: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 1,
        delay: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const features = [
    {
      title: "Dashboard Overview",
      description: "Complete business analytics with real-time performance metrics, revenue tracking, and quick actions",
      image: "/Screenshot 2025-06-23 at 19.13.21.png",
      highlight: "Real-time Analytics"
    },
    {
      title: "Driver Portal", 
      description: "Dedicated interface for drivers with priority trips, detailed bookings, navigation, and earnings tracking",
      image: "/Screenshot 2025-06-23 at 19.16.01 copy.png",
      highlight: "Driver Experience"
    },
    {
      title: "Location Analytics",
      description: "Advanced geolocation insights with comprehensive trip management, heat map visualization, and popular destination tracking",
      image: "/Screenshot 2025-06-23 at 19.31.12.png",
      highlight: "Smart Analytics"
    }
  ];

  return (
    <div className="relative min-h-[90vh] pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-green-50 blur-3xl opacity-30"></div>
        <div className="absolute -bottom-[20%] right-[5%] w-[40%] h-[50%] rounded-full bg-blue-50 blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
            className="relative z-10"
          >
            <motion.h1 
              variants={headingVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
            >
              Simplify Dispatching and{' '}
              <span className="text-green-500">Manage Rides Effortlessly</span>
            </motion.h1>
            
            <motion.p 
              variants={paragraphVariants}
              className="mt-6 text-xl text-gray-600"
            >
              Never miss any rides. Keep your bookings, drivers, and clients perfectly organized with our comprehensive transportation management platform.
            </motion.p>

            {/* Key Features List */}
            <motion.div
              variants={paragraphVariants}
              className="mt-8 grid grid-cols-2 gap-4"
            >
              {[
                { icon: BarChart3, text: "Real-time Analytics" },
                { icon: Users, text: "Driver Management" },
                { icon: MapPin, text: "Location Insights" },
                { icon: Shield, text: "Secure & Reliable" }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </motion.div>
            
            {currentUser ? (
              <motion.div variants={buttonVariants}>
                <Link to="/dashboard" className="mt-8 inline-block">
                  <button className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Go to Dashboard
                  </button>
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                variants={buttonVariants}
                className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
              >
                <button
                  onClick={() => setShowSignUpModal(true)}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Get Started Free
                </button>
                <Link
                  to="/contact"
                  className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Suggest Features
                </Link>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div 
            className="mt-12 lg:mt-0 relative"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Increased padding to accommodate floating elements better */}
            <div className="relative px-12 py-12">
              {/* Feature showcase container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Feature tabs */}
                <div className="flex bg-gray-50 border-b border-gray-200">
                  {features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeFeature === index
                          ? 'text-green-600 bg-white border-b-2 border-green-500'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {feature.highlight}
                    </button>
                  ))}
                </div>

                {/* Feature content */}
                <div className="relative h-80 sm:h-96">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: activeFeature === index ? 1 : 0,
                        scale: activeFeature === index ? 1 : 0.95
                      }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 ${activeFeature === index ? 'z-10' : 'z-0'}`}
                    >
                      <div className="h-full flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        </div>
                        <div className="p-4 bg-white">
                          <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress indicators */}
                <div className="absolute bottom-20 left-4 flex space-x-2">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        activeFeature === index ? 'bg-green-500' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Fixed floating elements - repositioned to avoid overlap */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-white rounded-lg shadow-xl p-4 z-40 hidden sm:block max-w-[200px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">99 Locations</p>
                    <p className="text-xs text-gray-500">90 Total Trips</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-xl p-4 z-40 hidden sm:block max-w-[240px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Top Pickup: Trieste Port</p>
                    <p className="text-xs text-gray-500">Top Dropoff: Venice</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 items-center justify-center flex-col"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            y: [0, 10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <p className="text-sm text-gray-500 mb-2">Scroll to explore</p>
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex items-start justify-center">
            <motion.div 
              className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2"
              animate={{
                y: [0, 15, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Login Modal */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login"
      >
        <LoginForm 
          onSuccess={() => {
            setShowLoginModal(false);
          }} 
        />
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setShowSignUpModal(true);
              }}
              className="text-green-600 hover:text-green-700 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </Modal>

      {/* Sign Up Modal */}
      <Modal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Sign Up"
      >
        <SignUpForm 
          onSuccess={() => {
            setShowSignUpModal(false);
          }} 
        />
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => {
                setShowSignUpModal(false);
                setShowLoginModal(true);
              }}
              className="text-green-600 hover:text-green-700 hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
}