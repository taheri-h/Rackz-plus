import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

const SetupPayment: React.FC = () => {
  const { packageName } = useParams<{ packageName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);

  // Only allow setup packages (checkout, subscriptions, crm, marketplace) on this page
  const validSetupPackages = ['checkout', 'subscriptions', 'crm', 'marketplace'];

  const packageInfo: Record<string, { name: string; price: string; fullPrice: number }> = {
    'checkout': { name: 'Stripe Checkout Setup', price: '€299', fullPrice: 299 },
    'subscriptions': { name: 'Subscriptions Setup', price: '€749', fullPrice: 749 },
    'crm': { name: 'CRM Integration', price: '€1499', fullPrice: 1499 },
    'marketplace': { name: 'Marketplace Setup', price: 'from €1999', fullPrice: 1999 }
  };

  // Redirect if not a valid setup package
  useEffect(() => {
    if (!packageName || !validSetupPackages.includes(packageName)) {
      navigate('/setup');
      return;
    }

    if (!user) {
      navigate('/signin');
      return;
    }

    window.scrollTo(0, 0);
    // Get form data from user-specific sessionStorage
    const userFormKey = `setupFormData_${user.id}`;
    const stored = sessionStorage.getItem(userFormKey);
    if (stored) {
      const data = JSON.parse(stored);
      // Only use if it belongs to current user
      if (data.email === user.email) {
        setSetupData(data);
      } else {
        navigate(`/setup-form/${packageName}`);
      }
    } else {
      // If no form data, redirect back to form
      navigate(`/setup-form/${packageName}`);
    }
  }, [packageName, navigate, user]);

  if (!packageName || !validSetupPackages.includes(packageName)) {
    return null;
  }

  const currentPackage = packageInfo[packageName] || packageInfo['checkout'];
  
  // Calculate 50% upfront payment (round up to nearest whole number)
  const upfrontAmount = Math.ceil(currentPackage.fullPrice / 2);
  const upfrontPrice = packageName === 'marketplace' 
    ? `from €${upfrontAmount}` 
    : `€${upfrontAmount}`;

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

      // Simulate API call to create Stripe Checkout session
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store payment confirmation with user-specific keys
      const paymentData = {
        ...setupData,
        email: user.email,
        userId: user.id,
        paymentStatus: 'completed',
        paymentDate: new Date().toISOString(),
        package: packageName,
        packageName: currentPackage.name,
        fullPrice: currentPackage.price,
        upfrontAmount: upfrontPrice,
        fullPriceValue: currentPackage.fullPrice,
        upfrontAmountValue: upfrontAmount
      };

      // Use user-specific storage keys
      const userPaymentKey = `setupPaymentData_${user.id}`;
      const userFormKey = `setupFormData_${user.id}`;
      
      sessionStorage.setItem(userPaymentKey, JSON.stringify(paymentData));
      sessionStorage.removeItem(userFormKey); // Clean up form data

      // Save to user-specific requests
      const userStorageKey = `userSetupRequests_${user.id}`;
      const userRequests = localStorage.getItem(userStorageKey) || '[]';
      const parsed = JSON.parse(userRequests);
      parsed.push({
        id: `request-${Date.now()}`,
        ...paymentData,
        status: 'payment_completed',
        createdAt: paymentData.paymentDate,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(userStorageKey, JSON.stringify(parsed));

      // Redirect to status page
      navigate(`/setup-status/${packageName}`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!setupData) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>Complete Payment - {currentPackage.name} | Fynteq</title>
        <meta name="description" content={`Complete your payment for ${currentPackage.name}. Secure checkout with Stripe.`} />
      </Helmet>

      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Complete Payment</h1>
          <p className="text-slate-600">One-time payment for your setup service</p>
        </div>

        <div className="card p-8">
          {/* Order Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Service</span>
                <span className="text-slate-900 font-medium">{currentPackage.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Company</span>
                <span className="text-slate-900 font-medium">{setupData.company}</span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600">Full Price</span>
                  <span className="text-slate-600 line-through">
                    {currentPackage.price}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-slate-900">Amount Due Now (50%)</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {upfrontPrice}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-left">50% upfront, 50% after delivery.</p>
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

          {/* Service Details */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">What's Included</h3>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Professional setup and configuration</li>
              <li>• Testing and quality assurance</li>
              <li>• Documentation and handover</li>
              <li>• 30 days of support included</li>
            </ul>
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
            {isProcessing ? 'Processing Payment...' : `Pay ${upfrontPrice} Now`}
          </button>

          <p className="mt-4 text-xs text-center text-slate-500">
            By completing payment, you agree to our{' '}
            <a href="/terms" className="text-slate-900 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-slate-900 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPayment;

