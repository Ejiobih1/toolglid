import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const PremiumCheckout = ({ darkMode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Paystack configuration from environment variables
  const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
  const PAYSTACK_PLAN_CODE = process.env.REACT_APP_PAYSTACK_PLAN_CODE;
  const PAYSTACK_AMOUNT = process.env.REACT_APP_PAYSTACK_AMOUNT || 1500000; // ₦15,000 in kobo (smallest currency unit)
  const PAYSTACK_CURRENCY = process.env.REACT_APP_PAYSTACK_CURRENCY || 'NGN';

  // Check if Paystack public key is configured
  useEffect(() => {
    if (PAYSTACK_PUBLIC_KEY && !PAYSTACK_PUBLIC_KEY.includes('your_public_key_here')) {
      setPaystackLoaded(true);
    }
  }, [PAYSTACK_PUBLIC_KEY]);

  const handleCheckout = async () => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    if (!paystackLoaded) {
      setError('Payment system is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user email
      const userEmail = user.email;

      // Callback URL after payment (Paystack will redirect here)
      const callbackUrl = `${window.location.origin}/?payment=callback`;

      console.log('Initializing Paystack transaction...');

      // Get the session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication error. Please sign in again.');
      }

      // Call Edge Function to initialize Paystack transaction
      const { data, error: initError } = await supabase.functions.invoke(
        'paystack-initialize',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            userId: user.id,
            email: userEmail,
            amount: PAYSTACK_AMOUNT, // Amount in kobo
            currency: PAYSTACK_CURRENCY,
            planCode: PAYSTACK_PLAN_CODE,
            callbackUrl: callbackUrl,
          },
        }
      );

      if (initError || !data?.success) {
        throw new Error(data?.error || initError?.message || 'Failed to initialize payment');
      }

      console.log('Paystack transaction initialized:', data);

      // Store reference in localStorage for verification on return
      localStorage.setItem('paystack_pending_reference', data.reference);
      localStorage.setItem('paystack_pending_user_id', user.id);

      // Redirect to Paystack's authorization URL in a new tab
      const checkoutWindow = window.open(data.authorization_url, '_blank');

      if (!checkoutWindow) {
        throw new Error('Please allow popups to complete payment. Click the button again after allowing popups.');
      }

      setLoading(false);

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
          'Subscribe Now - ₦15,000/month'
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
