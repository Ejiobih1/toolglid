import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle, Loader, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthModal = ({ darkMode, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', or 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthLabel, setPasswordStrengthLabel] = useState('');

  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Real-time email validation
  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }, [email]);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    if (checks.length) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.numbers) strength += 20;
    if (checks.special) strength += 20;

    return { strength, checks };
  };

  // Real-time password strength validation
  useEffect(() => {
    if (mode === 'register' && password) {
      const { strength, checks } = calculatePasswordStrength(password);
      setPasswordStrength(strength);

      if (strength < 40) {
        setPasswordStrengthLabel('Weak');
        setPasswordError('Password is too weak');
      } else if (strength < 60) {
        setPasswordStrengthLabel('Fair');
        setPasswordError('Password could be stronger');
      } else if (strength < 80) {
        setPasswordStrengthLabel('Good');
        setPasswordError('');
      } else {
        setPasswordStrengthLabel('Strong');
        setPasswordError('');
      }

      // Specific password requirements
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
      }
    } else {
      setPasswordStrength(0);
      setPasswordStrengthLabel('');
      setPasswordError('');
    }
  }, [password, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (passwordStrength < 60) {
        setError('Please use a stronger password');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Better error messages
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before signing in.');
          } else {
            throw error;
          }
        }

        setSuccess('Login successful!');
        setTimeout(() => {
          onSuccess(data.user);
        }, 1000);

      } else if (mode === 'register') {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (data.session) {
          // Email confirmation disabled - user is logged in immediately
          setSuccess('Account created successfully!');
          setTimeout(() => {
            onSuccess(data.user);
          }, 1000);
        } else if (data.user && !data.session) {
          // Email confirmation enabled - show verification screen
          setMode('verify');
          setSuccess('Verification code sent to your email! Please check your inbox.');
        }

      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP and log in automatically
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          throw new Error('Invalid or expired verification code. Please try again.');
        }
        throw error;
      }

      setSuccess('Email verified! Logging you in...');

      // Auto-login after successful verification
      setTimeout(() => {
        onSuccess(data.user);
      }, 1500);

    } catch (error) {
      setError(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccess('New verification code sent! Check your email.');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-orange-500';
    if (passwordStrength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Verification Mode
  if (mode === 'verify') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className={`max-w-md w-full rounded-2xl p-8 ${
          darkMode ? 'bg-[#2A2A3E]' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Verify Your Email
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>

          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest transition-colors ${
                  darkMode
                    ? 'bg-[#1E1E2E] border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-500 text-sm">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                loading || verificationCode.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transform hover:scale-105'
              } text-white`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Verify & Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Didn't receive the code?{' '}
              <button
                onClick={resendVerificationCode}
                className="text-purple-500 font-semibold hover:text-purple-600 transition-colors"
                disabled={loading}
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login/Register Mode
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`max-w-md w-full rounded-2xl p-8 ${
        darkMode ? 'bg-[#2A2A3E]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {mode === 'login'
            ? 'Sign in to access your premium features'
            : 'Create an account and verify your email to get started'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                  emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : darkMode
                    ? 'bg-[#1E1E2E] border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                disabled={loading}
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-colors ${
                  passwordError && mode === 'register'
                    ? 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/20'
                    : darkMode
                    ? 'bg-[#1E1E2E] border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator (Register only) */}
            {mode === 'register' && password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Password Strength:
                  </span>
                  <span className={`font-semibold ${
                    passwordStrength < 40 ? 'text-red-500' :
                    passwordStrength < 60 ? 'text-orange-500' :
                    passwordStrength < 80 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {passwordStrengthLabel}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                {passwordError && (
                  <p className="text-orange-500 text-xs mt-1">{passwordError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Use 8+ characters with uppercase, lowercase, numbers & symbols
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : darkMode
                      ? 'bg-[#1E1E2E] border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 text-sm">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || emailError || (mode === 'register' && (passwordError || password !== confirmPassword))}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
              loading || emailError || (mode === 'register' && (passwordError || password !== confirmPassword))
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transform hover:scale-105'
            } text-white`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              className="text-purple-500 font-semibold hover:text-purple-600 transition-colors"
              disabled={loading}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
