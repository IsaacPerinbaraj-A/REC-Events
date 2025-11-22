import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';  // ← ADD THIS
import { saveAuth } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [isStudent, setIsStudent] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast-enter flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-lg shadow-2xl max-w-md';
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span class="text-${type === 'success' ? 'green' : 'red'}-600 font-bold text-xl">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  const handleSwitch = () => {
    setError('');
    setIsStudent(!isStudent);
    setEmail('');
    setPassword('');
  };

  /*const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Simulate API call - TODO: Replace with actual backend
    setTimeout(() => {
      const demoUsers = {
        'student@rec.edu': { role: 'student', name: 'John Doe' },
        'manager@rec.edu': { role: 'manager', name: 'Admin User' }
      };

      const user = demoUsers[email];

      if (!user) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const attemptedRole = isStudent ? 'student' : 'manager';
      if (user.role !== attemptedRole) {
        setError(`Access denied! This is the ${attemptedRole} portal. Please use the correct login portal.`);
        setLoading(false);
        return;
      }

      showToast(`Login successful! Welcome back ${user.name}.`, 'success');
      setTimeout(() => {
        if (isStudent) {
          navigate('/student-dashboard');
        } else {
          navigate('/manager-dashboard');
        }
      }, 1500);
      setLoading(false);
    }, 1500);
  };*/
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!email || !password) {
    setError('Please fill in all fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('Please enter a valid email address');
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  setLoading(true);

  try {
    // Call real backend API
    const response = await authAPI.login({
      email,
      password,
      role: isStudent ? 'student' : 'manager'
    });

    if (response.success) {
      // Save token and user data
      saveAuth(response.token, response.user);
      
      showToast(`Welcome back, ${response.user.name}!`, 'success');
      
      // Redirect based on role
      setTimeout(() => {
        if (response.user.role === 'student') {
          navigate('/student-dashboard');
        } else if (response.user.role === 'manager') {
          navigate('/manager-dashboard');
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle different error types
    if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError('Login failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};


  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('Password reset link sent to your email!', 'success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Animated Background with GIF Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black animate-gradient"></div>
        
        {/* Event-related Background GIF - Using a placeholder, replace with actual event GIF */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://plus.unsplash.com/premium_photo-1683121710572-7723bd2e235d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXJ0aWZpY2lhbCUyMGludGVsbGlnZW5jZXxlbnwwfHwwfHx8MA%3D%3D')",
            //backgroundImage: "url('https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXJjZTM0aGJ4YnhzNGxqY2ExdGYyZWJydWN4dWRodnBpMzQxdXQ0aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlQ3nHyLMvte/giphy.gif')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>

        {/* Floating Particles Animation */}
        <div className="absolute inset-0">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>
      </div>

      {/* Toast Container */}
      <div id="toastContainer" className="fixed top-5 right-5 z-50 flex flex-col gap-2"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Welcome Section with Animations */}
          <div className="hidden lg:block text-white space-y-6 animate-slide-in-left">
            {/* Logo with Pulse Animation */}
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-700 p-4 rounded-2xl shadow-2xl animate-pulse-slow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  REC Events
                </h1>
                <p className="text-purple-300 text-lg">Campus Event Management System</p>
              </div>
            </div>

            {/* Animated Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <div className="bg-purple-700 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-time Event Management</h3>
                  <p className="text-gray-400 text-sm">Manage and track events seamlessly</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="bg-purple-700 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Easy Registration</h3>
                  <p className="text-gray-400 text-sm">One-click event registration with QR codes</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className="bg-purple-700 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Analytics & Insights</h3>
                  <p className="text-gray-400 text-sm">Track attendance and engagement metrics</p>
                </div>
              </div>
            </div>

            {/* Stats with Count-up Animation */}
            <div className="grid grid-cols-3 gap-4 pt-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30">
                <div className="text-4xl font-bold text-purple-400 mb-1">500+</div>
                <div className="text-sm text-gray-400">Events</div>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30">
                <div className="text-4xl font-bold text-purple-400 mb-1">10K+</div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-700/30">
                <div className="text-4xl font-bold text-purple-400 mb-1">50+</div>
                <div className="text-sm text-gray-400">Clubs</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form with Glass Effect */}
          <div className="animate-slide-in-right">
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 overflow-hidden transform transition-all duration-500 hover:shadow-purple-700/20">
              
              {/* Toggle Switch with Animation */}
              <div className="p-2 bg-gray-900/50 border-b border-gray-800">
                <div className="flex bg-gray-900 rounded-xl p-1 relative">
                  {/* Sliding Background */}
                  <div 
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-purple-700 rounded-lg transition-transform duration-300 ease-out ${
                      !isStudent ? 'translate-x-full' : ''
                    }`}
                  ></div>
                  
                  <button
                    onClick={() => !isStudent && handleSwitch()}
                    className={`relative z-10 flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      isStudent
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Student
                    </span>
                  </button>
                  
                  <button
                    onClick={() => isStudent && handleSwitch()}
                    className={`relative z-10 flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      !isStudent
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Manager
                    </span>
                  </button>
                </div>
              </div>

              {/* Form Content with Smooth Transition */}
              <div className="p-8">
                {/* Header with Fade Animation */}
                <div className="mb-8 text-center animate-fade-in">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome Back! 👋
                  </h2>
                  
                  <p className="text-gray-400">
                    {isStudent 
                      ? 'Sign in to access your student portal and manage events' 
                      : 'Sign in to manage events and track registrations'}
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input with Icon Animation */}
                  <div className="transform transition-all duration-300 hover:scale-[1.02]">
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-purple-400">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-xl border-2 border-gray-800 focus:border-purple-700 focus:outline-none transition-all duration-300 hover:border-gray-700"
                        placeholder="you@rec.edu"
                      />
                    </div>
                  </div>

                  {/* Password Input with Show/Hide Animation */}
                  <div className="transform transition-all duration-300 hover:scale-[1.02]">
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-purple-400">
                        <svg className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900 text-white pl-12 pr-12 py-3 rounded-xl border-2 border-gray-800 focus:border-purple-700 focus:outline-none transition-all duration-300 hover:border-gray-700"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-purple-400 transition-all duration-300"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message with Slide Animation */}
                  {error && (
                    <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 animate-shake">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-700 text-purple-700 focus:ring-purple-700 focus:ring-offset-gray-900 transition-all duration-300"
                      />
                      <span className="text-gray-400 group-hover:text-white transition-colors duration-300">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-purple-400 hover:text-purple-300 transition-colors duration-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button with Loading Animation */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-center text-gray-500 text-sm mt-6 animate-fade-in" style={{animationDelay: '0.6s'}}>
              ©2025 REC Events. All rights reserved.
            </p>
          </div>

        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        .particle {
          position: absolute;
          background: rgba(167, 139, 250, 0.3);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .particle-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .particle-2 {
          width: 60px;
          height: 60px;
          top: 60%;
          left: 80%;
          animation-delay: 2s;
        }

        .particle-3 {
          width: 100px;
          height: 100px;
          top: 80%;
          left: 20%;
          animation-delay: 4s;
        }

        .particle-4 {
          width: 40px;
          height: 40px;
          top: 30%;
          left: 70%;
          animation-delay: 1s;
        }

        .particle-5 {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          animation-delay: 3s;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .toast-enter {
          animation: slideInRight 0.4s ease-out;
        }

        .toast-exit {
          animation: slideOutRight 0.4s ease-in;
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
