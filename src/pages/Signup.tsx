import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const packageName = searchParams.get('package');
  const billing = searchParams.get('billing') || 'monthly';
  const redirectPath = searchParams.get('redirect');
  const { signup, isAuthenticated } = useAuth();

  // Check if this is a setup package (from redirect path)
  const isSetupPackage = redirectPath && redirectPath.startsWith('/setup-form/');
  const setupPackageName = isSetupPackage && redirectPath ? redirectPath.replace('/setup-form/', '') : null;
  
  // Default packageName only if it's not a setup package
  const finalPackageName = isSetupPackage ? null : (packageName || 'starter');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated (only if no package selected - means they're trying to access signup directly)
  React.useEffect(() => {
    if (isAuthenticated && !finalPackageName && !redirectPath) {
      // If authenticated and no package/redirect, go to dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, finalPackageName, redirectPath]);

  // SaaS Package Info
  const saasPackageInfo: Record<string, { name: string; price: string }> = {
    'starter': { name: 'Starter', price: '$29' },
    'pro': { name: 'Pro', price: '$79' },
    'scale': { name: 'Scale', price: '$149' }
  };

  // Setup Package Info
  const setupPackageInfo: Record<string, { name: string; price: string; description: string }> = {
    'checkout': { name: 'Stripe Checkout Setup', price: '$299', description: 'Get paid online in 2–3 days' },
    'subscriptions': { name: 'Subscriptions Setup', price: '$749', description: 'Turn one-time buyers into recurring revenue' },
    'crm': { name: 'CRM Integration', price: '$1499', description: 'Connect payments with your CRM in 7–10 days' },
    'marketplace': { name: 'Marketplace Setup', price: 'from $1999', description: 'Build your platform like Etsy or Airbnb' }
  };

  // Determine which package info to use
  const packageInfo = isSetupPackage && setupPackageName 
    ? setupPackageInfo 
    : saasPackageInfo;
  
  const currentPackageName: string = isSetupPackage && setupPackageName 
    ? setupPackageName 
    : (finalPackageName || 'starter');

  const features = [
    { name: 'Payment Health Score', starter: true, pro: true, scale: true },
    { name: 'Failed Payment Alerts', starter: true, pro: true, scale: true },
    { name: 'Checkout Monitoring', starter: 'Basic', pro: 'Advanced', scale: 'Advanced' },
    { name: 'Subscription Health', starter: false, pro: true, scale: true },
    { name: 'Renewal Predictions', starter: false, pro: true, scale: true },
    { name: 'Chargeback Monitoring', starter: false, pro: true, scale: true },
    { name: 'AI Fix Suggestions', starter: 'Limited', pro: 'Full', scale: 'Full' },
    { name: 'Multi-Account Monitoring', starter: false, pro: false, scale: true },
    { name: 'Vendor/KYC Monitoring', starter: false, pro: false, scale: true },
    { name: 'Slack Alerts', starter: false, pro: false, scale: true },
    { name: 'Daily Digest', starter: false, pro: false, scale: true },
    { name: 'CRM Sync Alerts', starter: false, pro: false, scale: true },
  ];

  const currentPackage = packageInfo[currentPackageName] || (isSetupPackage ? setupPackageInfo['checkout'] : saasPackageInfo['starter']);
  
  // For setup packages, price is fixed (no monthly/yearly)
  // For SaaS packages, calculate based on billing
  const monthlyPrice = isSetupPackage 
    ? parseInt(currentPackage.price.replace(/[$,from\s]/gi, ''))
    : parseInt(currentPackage.price.replace('$', ''));
  const finalPrice = isSetupPackage 
    ? monthlyPrice 
    : (billing === 'yearly' ? Math.round(monthlyPrice * 12 * 0.66) : monthlyPrice);

  // Get features for the selected package (only for SaaS packages)
  const getPackageFeatures = () => {
    if (isSetupPackage) {
      // For setup packages, return setup-specific features
      const setupFeatures: Record<string, string[]> = {
        'checkout': [
          'Stripe Checkout or Payment Element',
          'Apple Pay & Google Pay setup',
          'Success/cancel pages + branded receipts',
          'Webhook setup + 1 live test payment'
        ],
        'subscriptions': [
          'Stripe Billing configuration',
          'Plans, trials, coupons, upgrades/downgrades',
          'Smart dunning + retry logic',
          'Customer Portal setup',
          '1 live subscription test'
        ],
        'crm': [
          'Install & configure Stripe connector',
          'Sync customers, invoices, subscriptions',
          'Webhooks → CRM alerts',
          'Reconciliation mapping',
          'Ops handover documentation'
        ],
        'marketplace': [
          'Connect Express onboarding',
          'Vendor KYC & payout automation',
          'Application fees and split payouts',
          '1 vendor test + operations runbook'
        ]
      };
      
      const packageKey = setupPackageName || 'checkout';
      return (setupFeatures[packageKey] || setupFeatures['checkout'] || []).map(feature => ({
        name: feature,
        value: true
      }));
    }
    
    // For SaaS packages
    return features
      .map(feature => {
        let value: boolean | string | undefined;
        if (finalPackageName === 'starter') {
          value = feature.starter;
        } else if (finalPackageName === 'pro') {
          value = feature.pro;
        } else if (finalPackageName === 'scale') {
          value = feature.scale;
        }
        
        if (value === true || (typeof value === 'string' && value.length > 0)) {
          return {
            name: feature.name,
            value: value === true ? true : value as string
          };
        }
        return null;
      })
      .filter((f): f is { name: string; value: boolean | string } => f !== null);
  };

  const packageFeatures = getPackageFeatures();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Sign up the user
      await signup(formData.email, formData.password, formData.name, formData.company);

      // Handle Setup service FIRST (check before SaaS packages)
      if (isSetupPackage && redirectPath) {
        // Handle Setup service - redirect to the intended setup form
        navigate(redirectPath, { replace: true });
      } else if (finalPackageName && ['starter', 'pro', 'scale'].includes(finalPackageName)) {
        // Handle SaaS service (home page packages)
        // Get the newly created user from AuthContext
        const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
        const userData = {
          ...formData,
          userId: currentUser.id,
          package: finalPackageName,
          billing: billing,
          price: finalPrice
        };
        // Use user-specific storage key
        const userSignupKey = `signupData_${currentUser.id}`;
        sessionStorage.setItem(userSignupKey, JSON.stringify(userData));
        // Store package in user-specific localStorage
        const userPackageKey = `userPackage_${currentUser.id}`;
        localStorage.setItem(userPackageKey, finalPackageName);
        
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
        const packageKey = finalPackageName.toLowerCase();
        const billingKey = billing as 'monthly' | 'yearly';
        const stripeLink = stripeLinks[packageKey]?.[billingKey];
        
        if (stripeLink) {
          // Redirect directly to Stripe checkout
          window.location.href = stripeLink;
        } else {
          // No Stripe link available, go to payment page
          navigate(`/payment?package=${finalPackageName}&billing=${billing}`);
        }
      } else {
        // Default redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>{`Sign Up - ${currentPackage.name}${!isSetupPackage ? ' Plan' : ''} | Rackz`}</title>
        <meta name="description" content={
          isSetupPackage 
            ? `Sign up for ${currentPackage.name}. ${'description' in currentPackage ? (currentPackage as { description: string }).description : ''}`
            : `Sign up for Rackz Pulse ${currentPackage.name} plan. Start monitoring your Stripe & PayPal payments with ${currentPackage.name} features.`
        } />
        <link rel="canonical" href={`https://getrackz.com/signup${isSetupPackage ? `?redirect=${redirectPath}` : `?package=${finalPackageName}&billing=${billing}`}`} />
      </Helmet>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Create Your Account</h1>
          <p className="text-slate-600">
            {isSetupPackage ? `Sign up for ${currentPackage.name}` : `Sign up for ${currentPackage.name} Plan`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Package Summary & Features */}
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                {isSetupPackage ? currentPackage.name : `${currentPackage.name} Plan`}
              </h2>
              
              {isSetupPackage && 'description' in currentPackage && (
                <p className="text-slate-600 mb-4">{(currentPackage as { description: string }).description}</p>
              )}
              
              {/* Price */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {!isSetupPackage && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600">Billing</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{billing}</span>
                  </div>
                )}
                <div className={`flex justify-between items-center ${!isSetupPackage ? 'pt-2 border-t border-slate-200' : ''}`}>
                  <span className="text-base font-semibold text-slate-900">
                    {isSetupPackage ? 'Fixed Price' : 'Total'}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {isSetupPackage 
                      ? currentPackage.price 
                      : `$${finalPrice.toLocaleString()}/${billing === 'yearly' ? 'yr' : 'mo'}`
                    }
                  </span>
                </div>
                {isSetupPackage && (
                  <p className="text-xs text-slate-500 mt-2 text-left">50% upfront, 50% after delivery.</p>
                )}
              </div>

              {/* Features List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                  {isSetupPackage ? "What's Included" : 'Included Features'}
                </h3>
                <ul className="space-y-3">
                  {packageFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-slate-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="flex-1">
                        <span className="text-sm text-slate-900 font-medium">{feature.name}</span>
                        {typeof feature.value === 'string' && feature.value !== 'true' && (
                          <span className="text-xs text-slate-500 ml-2">({feature.value})</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="card p-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="John Doe"
                aria-label="Full Name"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                maxLength={255}
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="you@example.com"
                aria-label="Email Address"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                maxLength={128}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="Min 8 chars: uppercase, lowercase, number"
                aria-label="Password"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-slate-500">
                Must contain uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                maxLength={100}
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                placeholder="Your Company"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-xl font-medium text-center transition-all ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : 'button-primary'
              }`}
            >
              {isSubmitting 
                ? 'Creating Account...' 
                : isSetupPackage 
                  ? 'Create Account & Continue to Setup Form'
                  : 'Create Account & Continue to Payment'
              }
            </button>
          </form>

            <p className="mt-6 text-xs text-center text-slate-500">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-slate-900 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-slate-900 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

