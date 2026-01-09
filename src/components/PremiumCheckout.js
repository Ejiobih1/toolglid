import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PremiumCheckout = ({ darkMode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Paystack configuration from environment variables
  const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
  const PAYSTACK_PLAN_CODE = process.env.REACT_APP_PAYSTACK_PLAN_CODE;
  const PAYSTACK_AMOUNT = process.env.REACT_APP_PAYSTACK_AMOUNT || 799; // $7.99 in cents
  const PAYSTACK_CURRENCY = process.env.REACT_APP_PAYSTACK_CURRENCY || 'USD';

  // Load Paystack Inline JS script
  useEffect(() => {
    // Check if script already exists
    if (window.PaystackPop) {
      setPaystackLoaded(true);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      setError('Failed to load payment system. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    // Validate Paystack configuration
    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.includes('your_public_key_here')) {
      setError('Payment system is not configured. Please contact support.');
      console.error('PAYSTACK_PUBLIC_KEY not set in environment variables');
      return;
    }

    if (!paystackLoaded || !window.PaystackPop) {
      setError('Payment system is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user email
      const userEmail = user.email;

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: userEmail,
        amount: PAYSTACK_AMOUNT, // Amount in cents (smallest currency unit)
        currency: PAYSTACK_CURRENCY, // USD by default, supports NGN, GHS, ZAR, KES
        plan: PAYSTACK_PLAN_CODE, // Subscription plan code
        ref: `${Date.now()}-${user.id}`, // Unique transaction reference
        metadata: {
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: user.id,
            },
            {
              display_name: 'Email',
              variable_name: 'email',
              value: userEmail,
            },
          ],
        },
        onClose: function() {
          // User closed the payment modal
          setLoading(false);
          console.log('Payment window closed');
        },
        callback: function(response) {
          // Payment successful - verify on backend
          console.log('Payment successful:', response);

          // Handle async verification in a separate function
          (async () => {
            try {
              // Get the session token
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();

              if (sessionError || !session) {
                throw new Error('Authentication error. Please sign in again.');
              }

              // Call Edge Function to verify payment and update user
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                'paystack-verify',
                {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: {
                    reference: response.reference,
                    userId: user.id,
                  },
                }
              );

              if (verifyError) {
                throw new Error(`Verification failed: ${verifyError.message}`);
              }

              if (verifyData && verifyData.success) {
                // Payment verified successfully
                alert('🎉 Welcome to Premium! Your subscription is now active.');
                window.location.href = `${window.location.origin}/?checkout=success`;
              } else {
                throw new Error('Payment verification failed. Please contact support.');
              }
            } catch (err) {
              console.error('Verification error:', err);
              setError(err.message || 'Failed to verify payment. Please contact support with your payment reference.');
              setLoading(false);
            }
          })();
        },
      });

      // Open Paystack payment popup
      handler.openIframe();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading || !user || !paystackLoaded}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
          loading || !user || !paystackLoaded
            ? 'bg-gray-400 cursor-not-allowed'
            : darkMode
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : !paystackLoaded ? (
          'Loading Payment System...'
        ) : !user ? (
          'Sign In to Subscribe'
        ) : (
          'Subscribe Now - $7.99/month'
        )}
      </button>

      {!user && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please sign in to access premium features
        </p>
      )}

      {user && paystackLoaded && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>✅ Secure payment powered by Paystack</p>
          <p>💳 Accepts cards, bank transfer, USSD & mobile money</p>
        </div>
      )}
    </div>
  );
};

export default PremiumCheckout;
