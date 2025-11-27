import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import StarterDashboard from '../components/dashboard/StarterDashboard';
import ProDashboard from '../components/dashboard/ProDashboard';
import ScaleDashboard from '../components/dashboard/ScaleDashboard';
import { apiCall } from '../utils/api';
import ConnectStripeButton from '../components/ConnectStripeButton';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, getAuthToken } = useAuth();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [packageType, setPackageType] = useState<string>('');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [stripeAccount, setStripeAccount] = useState<any | null>(null);
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'loading' | 'connected' | 'not_connected' | 'error'>('idle');
  const [stripeCharges, setStripeCharges] = useState<any[]>([]);
  const [stripeChargesStatus, setStripeChargesStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [stripeSubscriptions, setStripeSubscriptions] = useState<any[]>([]);
  const [stripeSubscriptionsStatus, setStripeSubscriptionsStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;
    
    // First, check if user has setup packages - if so, redirect to setup-dashboard
    const userSetupKey = `userSetupRequests_${user.id}`;
    const setupRequests = localStorage.getItem(userSetupKey);
    const userPaymentKey = `setupPaymentData_${user.id}`;
    const setupPayment = sessionStorage.getItem(userPaymentKey);
    
    let hasSetupPackages = false;
    
    // Check localStorage for setup requests
    if (setupRequests) {
      try {
        const requests = JSON.parse(setupRequests);
        hasSetupPackages = requests.some((req: any) => 
          req.paymentStatus === 'completed' && 
          ['checkout', 'subscriptions', 'crm', 'marketplace'].includes(req.package)
        );
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Check sessionStorage for recent setup payment
    if (!hasSetupPackages && setupPayment) {
      try {
        const payment = JSON.parse(setupPayment);
        hasSetupPackages = payment.paymentStatus === 'completed' && 
          ['checkout', 'subscriptions', 'crm', 'marketplace'].includes(payment.package);
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // If user has setup packages, redirect to setup-dashboard
    if (hasSetupPackages) {
      navigate('/setup-dashboard', { replace: true });
      return;
    }
    
    // Get package from URL params, payment data, or user data
    const urlPackage = searchParams.get('package');
    
    // Use user-specific storage keys
    const userSaaSPaymentKey = `paymentData_${user.id}`;
    const userPackageKey = `userPackage_${user.id}`;
    
    let foundPackage = '';
    
    // Priority: URL param > sessionStorage payment data > localStorage package
    if (urlPackage && ['starter', 'pro', 'scale'].includes(urlPackage)) {
      foundPackage = urlPackage;
      // Also save to localStorage for persistence
      localStorage.setItem(userPackageKey, urlPackage);
    } else {
      // Check sessionStorage for recent payment
      const stored = sessionStorage.getItem(userSaaSPaymentKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Only use if it belongs to current user
        if (data.email === user.email && data.package) {
          setPaymentData(data);
          foundPackage = data.package;
          // Save to localStorage for persistence
          localStorage.setItem(userPackageKey, data.package);
        }
      }
      
      // If still no package, try localStorage (persistent storage)
      if (!foundPackage) {
        const userPackage = localStorage.getItem(userPackageKey);
        if (userPackage && ['starter', 'pro', 'scale'].includes(userPackage)) {
          foundPackage = userPackage;
        } else {
          // Default to starter if nothing found
          foundPackage = 'starter';
          localStorage.setItem(userPackageKey, 'starter');
        }
      }
    }
    
    if (foundPackage) {
      setPackageType(foundPackage);
    }
  }, [navigate, searchParams, user]);

  // Load user-specific connected providers
  useEffect(() => {
    if (!user) return;
    
    const userProvidersKey = `connectedProviders_${user.id}`;
    const savedProviders = localStorage.getItem(userProvidersKey);
    if (savedProviders) {
      setConnectedProviders(JSON.parse(savedProviders));
    }
  }, [user]);

  // Load Stripe account data from backend for this user
  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();
    if (!token) return;

    const fetchStripeAccount = async () => {
      try {
        setStripeStatus('loading');
        const response = await apiCall('/stripe/account', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setStripeStatus('error');
          return;
        }

        const data = await response.json();

        if (data.connected && data.account) {
          setStripeAccount(data.account);
          setStripeStatus('connected');

          // Ensure 'stripe' is marked as connected in local state & storage
          const updatedProviders = connectedProviders.includes('stripe')
            ? connectedProviders
            : [...connectedProviders, 'stripe'];

          setConnectedProviders(updatedProviders);

          const userProvidersKey = `connectedProviders_${user.id}`;
          localStorage.setItem(userProvidersKey, JSON.stringify(updatedProviders));
        } else {
          setStripeStatus('not_connected');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading Stripe account:', error);
        }
        setStripeStatus('error');
      }
    };

    fetchStripeAccount();
    // We intentionally exclude connectedProviders from deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getAuthToken]);

  // Load recent Stripe charges for this user
  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();
    if (!token) return;

    const fetchCharges = async () => {
      try {
        setStripeChargesStatus('loading');
        const response = await apiCall('/stripe/charges', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setStripeChargesStatus('error');
          return;
        }

        const data = await response.json();
        if (data.charges && Array.isArray(data.charges)) {
          setStripeCharges(data.charges);
          setStripeChargesStatus('loaded');
        } else {
          setStripeCharges([]);
          setStripeChargesStatus('loaded');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading Stripe charges:', error);
        }
        setStripeChargesStatus('error');
      }
    };

    fetchCharges();
  }, [user, getAuthToken]);

  // Load Stripe subscriptions for this user
  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();
    if (!token) return;

    const fetchSubscriptions = async () => {
      try {
        setStripeSubscriptionsStatus('loading');
        const response = await apiCall('/stripe/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setStripeSubscriptionsStatus('error');
          return;
        }

        const data = await response.json();
        if (data.subscriptions && Array.isArray(data.subscriptions)) {
          setStripeSubscriptions(data.subscriptions);
          setStripeSubscriptionsStatus('loaded');
        } else {
          setStripeSubscriptions([]);
          setStripeSubscriptionsStatus('loaded');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading Stripe subscriptions:', error);
        }
        setStripeSubscriptionsStatus('error');
      }
    };

    fetchSubscriptions();
  }, [user, getAuthToken]);

  const providers = [
    { id: 'stripe', name: 'Stripe', logo: '/images/brands/stripe-logo-AQEyPRPODaTM3Ern.png.avif' },
    { id: 'paypal', name: 'PayPal', logo: '/images/brands/pngimg.com---paypal_png7-mePvDEDJbQCke023.png.avif' },
    { id: 'shopify', name: 'Shopify', logo: null }
  ];

  const handleConnectProvider = async (providerId: string) => {
    if (!user) return;
    
    // Stripe uses real OAuth flow via backend
    if (providerId === 'stripe') {
      try {
        const confirmed = window.confirm('Connect your Stripe account? You will be redirected to Stripe.');
        if (!confirmed) return;

        const response = await apiCall('/stripe/connect-url');
        if (!response.ok) {
          console.error('Failed to get Stripe Connect URL:', response.statusText);
          alert('Could not start Stripe connection. Please try again.');
          return;
        }

        const data = await response.json();
        if (!data.url) {
          alert('Stripe connection URL is missing. Please try again.');
          return;
        }

        // Redirect browser to Stripe Connect
        window.location.href = data.url;
      } catch (error) {
        console.error('Error starting Stripe Connect flow:', error);
        alert('Something went wrong starting the Stripe connection. Please try again.');
      }

      return;
    }

    // For other providers (PayPal, Shopify), keep simulated connection for now
    const confirmed = window.confirm(`Connect your ${providers.find(p => p.id === providerId)?.name} account?`);
    if (!confirmed) return;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedProviders = [...connectedProviders, providerId];
    setConnectedProviders(updatedProviders);

    // Save to user-specific storage
    const userProvidersKey = `connectedProviders_${user.id}`;
    localStorage.setItem(userProvidersKey, JSON.stringify(updatedProviders));

    alert(`${providers.find(p => p.id === providerId)?.name} account connected successfully!`);
  };

  const handleDisconnectProvider = (providerId: string) => {
    if (!user) return;
    
    const updatedProviders = connectedProviders.filter(p => p !== providerId);
    setConnectedProviders(updatedProviders);
    
    // Save to user-specific storage
    const userProvidersKey = `connectedProviders_${user.id}`;
    localStorage.setItem(userProvidersKey, JSON.stringify(updatedProviders));
  };


  const planName = packageType?.charAt(0).toUpperCase() + packageType?.slice(1) || 'Dashboard';

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{planName} Dashboard | Rackz Pulse</title>
        <meta name="description" content={`Monitor your Stripe & PayPal payments with Rackz Pulse ${planName} dashboard. Track payment health, alerts, and analytics.`} />
        <link rel="canonical" href="https://getrackz.com/dashboard" />
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 text-sm mt-1">Monitor your payment health and analytics</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Plan</div>
              <div className="font-semibold text-slate-900 mt-1">{planName}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Connect Payment Providers Section - Show for all plans */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Connect Payment Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const isConnected = connectedProviders.includes(provider.id);
              
              return (
                <div
                  key={provider.id}
                  className={`card p-6 text-center ${
                    isConnected
                      ? 'border-slate-900 border-2'
                      : ''
                  }`}
                >
                  <div className="mb-4">
                    {provider.logo ? (
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className={`h-10 w-auto mx-auto mb-3 transition-all ${
                          isConnected ? 'opacity-100 grayscale-0' : 'opacity-60 grayscale'
                        }`}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-slate-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">{provider.name.charAt(0)}</span>
                      </div>
                    )}
                    <h3 className="font-semibold text-slate-900 mb-1">{provider.name}</h3>
                    {isConnected && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-600 font-medium">Connected</span>
                        {provider.id === 'stripe' && stripeStatus === 'connected' && stripeAccount && (
                          <div className="text-[11px] text-slate-500">
                            {stripeAccount.business_profile?.name || stripeAccount.email || stripeAccount.id}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isConnected ? (
                    provider.id === 'stripe' ? (
                      <ConnectStripeButton
                        onConnected={() => {
                          if (!user) return;
                          const updatedProviders = [...connectedProviders, 'stripe'];
                          setConnectedProviders(updatedProviders);
                          const userProvidersKey = `connectedProviders_${user.id}`;
                          localStorage.setItem(
                            userProvidersKey,
                            JSON.stringify(updatedProviders)
                          );
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => handleConnectProvider(provider.id)}
                        className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm"
                      >
                        Connect
                      </button>
                    )
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Active</span>
                      </div>
                      <button
                        onClick={() => handleDisconnectProvider(provider.id)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Stripe Payments */}
        {stripeStatus === 'connected' && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Stripe Payments</h2>
            {stripeChargesStatus === 'loading' && (
              <p className="text-sm text-slate-500">Loading recent payments...</p>
            )}
            {stripeChargesStatus === 'error' && (
              <p className="text-sm text-red-500">Could not load Stripe payments.</p>
            )}
            {stripeChargesStatus === 'loaded' && stripeCharges.length === 0 && (
              <p className="text-sm text-slate-500">No recent payments found.</p>
            )}
            {stripeChargesStatus === 'loaded' && stripeCharges.length > 0 && (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stripeCharges.map((charge) => {
                      const date = new Date(charge.created * 1000);
                      const amount = (charge.amount / 100).toFixed(2);
                      const currency = (charge.currency || '').toUpperCase();
                      const isSuccess = charge.paid && charge.status === 'succeeded';

                      return (
                        <tr key={charge.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-700">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2 text-slate-900 font-medium">
                            {amount} {currency}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {charge.customer || '—'}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                isSuccess
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isSuccess ? 'Succeeded' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payment Issues / Failed Payments */}
        {stripeStatus === 'connected' && stripeChargesStatus === 'loaded' && (
          (() => {
            const failedCharges = stripeCharges.filter(
              (charge) => !charge.paid || charge.status !== 'succeeded'
            );

            if (failedCharges.length === 0) {
              return null;
            }

            return (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Issues</h2>
                <p className="text-sm text-slate-500 mb-3">
                  Recent failed or blocked payments from your connected Stripe account.
                </p>
                <div className="overflow-x-auto border border-amber-100 rounded-xl bg-amber-50/40">
                  <table className="min-w-full text-sm">
                    <thead className="bg-amber-50 border-b border-amber-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Customer</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedCharges.map((charge) => {
                        const date = new Date(charge.created * 1000);
                        const amount = (charge.amount / 100).toFixed(2);
                        const currency = (charge.currency || '').toUpperCase();
                        const reason =
                          charge.failure_message ||
                          charge.failure_code ||
                          'Payment did not succeed';

                        return (
                          <tr key={charge.id} className="border-t border-amber-100">
                            <td className="px-4 py-2 text-amber-900">
                              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-2 text-amber-900 font-medium">
                              {amount} {currency}
                            </td>
                            <td className="px-4 py-2 text-amber-900">
                              {charge.customer || '—'}
                            </td>
                            <td className="px-4 py-2 text-amber-900">
                              {reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        )}

        {/* Subscriptions View */}
        {stripeStatus === 'connected' && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Subscriptions</h2>
            {stripeSubscriptionsStatus === 'loading' && (
              <p className="text-sm text-slate-500">Loading subscriptions...</p>
            )}
            {stripeSubscriptionsStatus === 'error' && (
              <p className="text-sm text-red-500">Could not load subscriptions.</p>
            )}
            {stripeSubscriptionsStatus === 'loaded' && stripeSubscriptions.length === 0 && (
              <p className="text-sm text-slate-500">No subscriptions found.</p>
            )}
            {stripeSubscriptionsStatus === 'loaded' && stripeSubscriptions.length > 0 && (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Plan</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Next Billing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stripeSubscriptions.map((sub) => {
                      const firstItem = sub.items?.[0];
                      const amount =
                        firstItem && firstItem.amount != null
                          ? (firstItem.amount / 100).toFixed(2)
                          : null;
                      const currency = (firstItem?.currency || '').toUpperCase();
                      const interval = firstItem?.interval;

                      const nextBilling =
                        sub.current_period_end
                          ? new Date(sub.current_period_end * 1000).toLocaleDateString()
                          : '—';

                      let statusLabel = sub.status;
                      if (sub.cancel_at_period_end) {
                        statusLabel = 'Cancels at period end';
                      } else if (sub.canceled_at) {
                        statusLabel = 'Canceled';
                      }

                      const statusClass =
                        sub.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200';

                      return (
                        <tr key={sub.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-700">
                            {sub.customerName || sub.customerEmail || sub.customerId || '—'}
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {firstItem?.productName ||
                              firstItem?.priceNickname ||
                              firstItem?.productId ||
                              firstItem?.priceId ||
                              '—'}
                          </td>
                          <td className="px-4 py-2 text-slate-900 font-medium">
                            {amount ? `${amount} ${currency} / ${interval}` : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-700">{nextBilling}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Show appropriate dashboard based on plan */}
        {packageType && (
          <>
            {packageType === 'starter' && <StarterDashboard />}
            {packageType === 'pro' && <ProDashboard />}
            {packageType === 'scale' && <ScaleDashboard />}
          </>
        )}
        {!packageType && (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

