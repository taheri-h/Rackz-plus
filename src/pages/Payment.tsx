import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get('package') || 'starter';
  const billing = searchParams.get('billing') || 'monthly';

  const [signupData, setSignupData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Only allow SaaS packages (starter, pro, scale) on this page
  const validSaaSPackages = ['starter', 'pro', 'scale'];

  useEffect(() => {
    // Redirect if not a valid SaaS package
    if (!validSaaSPackages.includes(packageName)) {
      navigate('/');
      return;
    }

    if (!user) return;

    // Stripe payment links for all plans
    const stripeLinks: Record<string, { monthly: string; yearly: string }> = {
      'starter': {
        monthly: 'https://buy.stripe.com/6oU9AV2Gg3MB0vU0iu8Zq0b',
        yearly: 'https://buy.stripe.com/eVq3cx3Kk96VdiGghs8Zq0e'
      },
      'pro': {
        monthly: 'https://buy.stripe.com/dRm4gBdkU4QFa6ufdo8Zq0c',
        yearly: 'https://buy.stripe.com/14AeVf0y80Ap5Qec1c8Zq0f'
      },
      'scale': {
        monthly: 'https://buy.stripe.com/8x200l5Ss6YN1zYc1c8Zq0d',
        yearly: 'https://buy.stripe.com/dRmcN71Cc82R3I6fdo8Zq0g'
      }
    };
    
    // Check if we have a Stripe link for this plan and billing cycle
    const billingKey = billing as 'monthly' | 'yearly';
    const stripeLink = stripeLinks[packageName]?.[billingKey];
    
    if (stripeLink) {
      // Redirect directly to Stripe checkout
      window.location.href = stripeLink;
      return;
    }

    // Get signup data from user-specific sessionStorage
    const userSignupKey = `signupData_${user.id}`;
    const stored = sessionStorage.getItem(userSignupKey);
    if (stored) {
      const data = JSON.parse(stored);
      // Only use if it belongs to current user
      if (data.email === user.email) {
        setSignupData(data);
      }
    }
  }, [packageName, billing, navigate, user]);

  const packageInfo: Record<string, { name: string; price: string }> = {
    'starter': { name: 'Starter', price: '$29' },
    'pro': { name: 'Pro', price: '$79' },
    'scale': { name: 'Scale', price: '$149' }
  };

  // Only proceed if it's a valid SaaS package
  if (!validSaaSPackages.includes(packageName)) {
    return null;
  }

  const currentPackage = packageInfo[packageName] || packageInfo['starter'];
  const monthlyPrice = parseInt(currentPackage.price.replace('$', ''));
  
  // Always calculate price based on package and billing (monthly/yearly subscription)
  const finalPrice = billing === 'yearly' ? Math.round(monthlyPrice * 12 * 0.66) : monthlyPrice;

  const handlePayment = async () => {
    if (!user) {
      alert('Please sign in to complete payment');
      navigate('/signin');
      return;
    }

    setIsProcessing(true);

    try {
      // Here you would integrate with Stripe Checkout
      // For now, we'll simulate successful payment

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store payment confirmation with user-specific keys
      const paymentData = {
        ...signupData,
        email: user.email,
        userId: user.id,
        paymentStatus: 'completed',
        amount: finalPrice,
        billing: billing,
        package: packageName
      };

      // Use user-specific storage keys
      const userPaymentKey = `paymentData_${user.id}`;
      const userPackageKey = `userPackage_${user.id}`;
      
      sessionStorage.setItem(userPaymentKey, JSON.stringify(paymentData));
      // Also store in localStorage for persistence
      localStorage.setItem(userPackageKey, packageName);

      // Redirect to dashboard with package info
      navigate(`/dashboard?package=${packageName}`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>Complete Payment - {currentPackage.name} Plan | Rackz Pulse</title>
        <meta name="description" content={`Complete your payment for Rackz Pulse ${currentPackage.name} plan. Secure checkout with Stripe.`} />
        <link rel="canonical" href={`https://getrackz.com/payment?package=${packageName}&billing=${billing}`} />
      </Helmet>
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Complete Payment</h1>
          <p className="text-slate-600">Secure checkout for your subscription</p>
        </div>

        <div className="card p-8">
          {/* Order Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">{currentPackage.name} Plan</span>
                <span className="text-slate-900 font-medium">{currentPackage.price}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Billing Cycle</span>
                <span className="text-slate-900 font-medium capitalize">{billing}</span>
              </div>
              {billing === 'yearly' && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Yearly Discount (34%)</span>
                  <span className="text-sm font-medium">-${(monthlyPrice * 12 - finalPrice).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ${finalPrice.toLocaleString()}/{billing === 'yearly' ? 'yr' : 'mo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all card">
                <input type="radio" name="payment" value="stripe" defaultChecked className="mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Credit/Debit Card</div>
                  <div className="text-sm text-slate-500">Powered by Stripe</div>
                </div>
                <img src="/images/brands/stripe-logo-AQEyPRPODaTM3Ern.png.avif" alt="Stripe" className="h-6 opacity-60 grayscale" />
              </label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Secure Payment</p>
                <p className="text-xs text-slate-600">Your payment information is encrypted and secure. We never store your card details.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full py-3 px-6 rounded-xl font-medium text-center transition-all ${
              isProcessing
                ? 'bg-slate-400 cursor-not-allowed text-white'
                : 'button-primary'
            }`}
          >
            {isProcessing ? 'Processing Payment...' : `Pay $${finalPrice.toLocaleString()}`}
          </button>

          <p className="mt-4 text-xs text-center text-slate-500">
            30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;

