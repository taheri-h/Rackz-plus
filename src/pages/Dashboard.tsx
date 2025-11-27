import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import StarterDashboard from '../components/dashboard/StarterDashboard';
import ProDashboard from '../components/dashboard/ProDashboard';
import ScaleDashboard from '../components/dashboard/ScaleDashboard';
import PaymentHealthCard from '../components/dashboard/PaymentHealthCard';
import { apiCall } from '../utils/api';
import ConnectStripeButton from '../components/ConnectStripeButton';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, getAuthToken } = useAuth();
  const [packageType, setPackageType] = useState<string>('');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [stripeAccount, setStripeAccount] = useState<any | null>(null);
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'loading' | 'connected' | 'not_connected' | 'error'>('idle');
  const [stripeCharges, setStripeCharges] = useState<any[]>([]);
  const [stripeChargesStatus, setStripeChargesStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [stripeSubscriptions, setStripeSubscriptions] = useState<any[]>([]);
  const [stripeSubscriptionsStatus, setStripeSubscriptionsStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [stripeRangeDays, setStripeRangeDays] = useState<7 | 30 | 90 | 180 | 365>(30);
  const [stripeSummary, setStripeSummary] = useState<{
    totalVolume: number;
    currency: string | null;
    totalCount: number;
    failedCount: number;
  } | null>(null);
  const [stripeSummaryStatus, setStripeSummaryStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [selectedCharge, setSelectedCharge] = useState<any | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any | null>(null);
  const [failureReasons, setFailureReasons] = useState<{
    reasons: { reason: string; count: number; amount: number }[];
    totalFailedAmount: number;
    currency: string | null;
  } | null>(null);

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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Dashboard useEffect triggered, user:', user ? { id: user.id, email: user.email } : 'null');
    }
    
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No user, skipping Stripe fetch');
      }
      return;
    }

    const token = getAuthToken();
    
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No auth token, skipping Stripe fetch');
      }
      return;
    }

    const fetchStripeAccount = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting Stripe account fetch...');
      }
      try {
        setStripeStatus('loading');
        const response = await apiCall('/stripe/account', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (process.env.NODE_ENV === 'development') {
            console.error('Stripe account fetch failed:', response.status, errorData);
          }
          setStripeStatus('error');
          return;
        }

        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('Stripe account response:', data);
        }

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
          if (process.env.NODE_ENV === 'development') {
            console.log('Stripe not connected for user:', data);
          }
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
        const response = await apiCall(`/stripe/charges?rangeDays=${stripeRangeDays}`, {
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
  }, [user, getAuthToken, stripeRangeDays]);

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

  // Load Stripe summary metrics (last 30 days)
  useEffect(() => {
    if (!user) return;

    const token = getAuthToken();
    if (!token) return;

    const fetchSummary = async () => {
      try {
        setStripeSummaryStatus('loading');

        const currentRes = await apiCall(`/stripe/summary?rangeDays=${stripeRangeDays}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!currentRes.ok) {
          setStripeSummaryStatus('error');
          return;
        }

        const currentData = await currentRes.json();
        setStripeSummary({
          totalVolume: currentData.totalVolume || 0,
          currency: currentData.currency || null,
          totalCount: currentData.totalCount || 0,
          failedCount: currentData.failedCount || 0,
        });

        // Load failures summary for reasons & revenue at risk (7 or 30 days)
        try {
          const rangeForFailures = stripeRangeDays >= 30 ? 30 : 7;
          const failuresRes = await apiCall(
            `/stripe/failures-summary?rangeDays=${rangeForFailures}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (failuresRes.ok) {
            const failuresData = await failuresRes.json();
            setFailureReasons({
              reasons: failuresData.reasons || [],
              totalFailedAmount: failuresData.totalFailedAmount || 0,
              currency: failuresData.currency || null,
            });
          } else {
            setFailureReasons(null);
          }
        } catch {
          setFailureReasons(null);
        }

        setStripeSummaryStatus('loaded');
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading Stripe summary:', error);
        }
        setStripeSummaryStatus('error');
      }
    };

    fetchSummary();
  }, [user, getAuthToken, stripeRangeDays]);

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

  // Derived MRR by plan from subscriptions
  const mrrByPlan = React.useMemo(() => {
    const planMap = new Map<
      string,
      {
        label: string;
        currency: string | null;
        mrr: number;
      }
    >();

    stripeSubscriptions.forEach((sub) => {
      // Only consider active or trialing subscriptions that are not fully cancelled
      if (
        !['active', 'trialing', 'past_due'].includes(sub.status) ||
        sub.canceled_at
      ) {
        return;
      }

      (sub.items || []).forEach((item: any) => {
        if (item.amount == null || !item.currency || !item.interval) return;

        const amount = item.amount; // in smallest currency unit
        const currency = (item.currency as string).toUpperCase();

        // Normalize to monthly recurring value
        let monthlyAmount = amount;
        if (item.interval === 'year') {
          monthlyAmount = amount / 12;
        } else if (item.interval === 'week') {
          monthlyAmount = amount * 4; // simple approximation
        } else if (item.interval === 'day') {
          monthlyAmount = amount * 30; // simple approximation
        }

        const label =
          item.productName ||
          item.priceNickname ||
          item.productId ||
          item.priceId ||
          'Unnamed plan';

        const key = `${label}:${currency}`;
        const existing = planMap.get(key);

        if (existing) {
          existing.mrr += monthlyAmount;
        } else {
          planMap.set(key, {
            label,
            currency,
            mrr: monthlyAmount,
          });
        }
      });
    });

    return Array.from(planMap.values()).sort((a, b) => b.mrr - a.mrr);
  }, [stripeSubscriptions]);

  // Derived churn candidates from subscriptions
  const churnCandidates = React.useMemo(() => {
    return stripeSubscriptions
      .filter((sub) => sub.cancel_at_period_end || sub.canceled_at)
      .map((sub) => {
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

        return {
          id: sub.id,
          customer:
            sub.customerName || sub.customerEmail || sub.customerId || '—',
          plan:
            firstItem?.productName ||
            firstItem?.priceNickname ||
            firstItem?.productId ||
            firstItem?.priceId ||
            '—',
          amount: amount ? `${amount} ${currency} / ${interval}` : null,
          nextBilling,
          status: sub.cancel_at_period_end ? 'Cancels at period end' : 'Canceled',
        };
      });
  }, [stripeSubscriptions]);

  // Derived health metrics based on summary for Payment Health Score card
  const healthMetrics = React.useMemo(() => {
    if (!stripeSummary) {
      return null;
    }

    const failureRate =
      stripeSummary.totalCount > 0
        ? stripeSummary.failedCount / stripeSummary.totalCount
        : 0;
    const successRate = 1 - failureRate;

    const healthScore = Math.round(successRate * 100);

    return {
      failureRatePct: failureRate * 100,
      successRatePct: successRate * 100,
      healthScore,
    };
  }, [stripeSummary]);

  // Debug: Log current state (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Dashboard render state:', {
      user: user ? { id: user.id, email: user.email, stripeAccountId: user.stripeAccountId } : null,
      stripeStatus,
      packageType,
      connectedProviders,
    });
  }

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
        {/* Stripe Connection Status Messages */}
        {stripeStatus === 'loading' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">Loading Stripe account...</p>
          </div>
        )}
        {stripeStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">Error loading Stripe account. Please try refreshing the page.</p>
          </div>
        )}
        {stripeStatus === 'not_connected' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">No Stripe account connected. Connect your Stripe account below to see payment data.</p>
          </div>
        )}
        {/* Stripe Summary Cards + Range Filter */}
        {stripeStatus === 'connected' && (
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Stripe Performance</h2>
                <p className="text-xs text-slate-500">
                  Key metrics for your connected Stripe account.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1">
                {([7, 30, 90, 180, 365] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setStripeRangeDays(days)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                      stripeRangeDays === days
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {days === 365 ? 'Last 12m' : days === 180 ? 'Last 6m' : `Last ${days}d`}
                  </button>
                ))}
              </div>
            </div>

            {stripeSummaryStatus === 'loaded' && stripeSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Volume (last {stripeRangeDays} days)
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {stripeSummary.totalVolume
                      ? `${(stripeSummary.totalVolume / 100).toFixed(2)} ${(stripeSummary.currency || '').toUpperCase()}`
                      : '0.00'}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Payments
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {stripeSummary.totalCount}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Failed Payments
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {stripeSummary.failedCount}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

        {/* Health + Payments Overview + Recent Stripe Payments */}
        {stripeStatus === 'connected' && (
          <div className="mb-12 space-y-8">
            {/* Payment Health Score card, driven by Stripe summary */}
            {stripeSummaryStatus === 'loaded' && stripeSummary && (
              <>
                <PaymentHealthCard
                  healthScore={healthMetrics?.healthScore}
                  successRatePct={healthMetrics?.successRatePct}
                  failureRatePct={healthMetrics?.failureRatePct}
                  successfulPayments={
                    stripeSummary.totalCount - stripeSummary.failedCount
                  }
                  failedPayments={stripeSummary.failedCount}
                  rangeLabel={
                    stripeRangeDays === 365
                      ? '12 months'
                      : stripeRangeDays === 180
                      ? '6 months'
                      : `${stripeRangeDays} days`
                  }
                />

                {/* Payments Overview + 7-Day Trend, synced with Stripe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">
                      Payments Overview ({stripeRangeDays === 365
                        ? '12 months'
                        : stripeRangeDays === 180
                        ? '6 months'
                        : `${stripeRangeDays} days`}
                      )
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Successful</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {stripeSummary.totalCount - stripeSummary.failedCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Failed</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {stripeSummary.failedCount}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Total Revenue</span>
                          <span className="text-xl font-bold text-slate-900">
                            {stripeSummary.totalVolume
                              ? `${(stripeSummary.totalVolume / 100).toFixed(2)} ${(stripeSummary.currency || '').toUpperCase()}`
                              : `0.00 ${(stripeSummary.currency || '').toUpperCase()}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Avg Success Rate</span>
                        <span className="text-base font-semibold text-slate-900">
                          {healthMetrics?.successRatePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">7-Day Trend</h3>
                    <div className="h-32 flex items-end justify-between gap-1">
                      {(() => {
                        const days: { label: string; success: number; failed: number }[] = [];
                        const now = new Date();
                        const dayKeys: string[] = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date(now);
                          d.setDate(d.getDate() - i);
                          const key = d.toISOString().slice(0, 10);
                          dayKeys.push(key);
                          days.push({
                            label: d.toLocaleDateString(undefined, { weekday: 'short' }),
                            success: 0,
                            failed: 0,
                          });
                        }

                        const sevenDaysAgoMs =
                          now.getTime() - 7 * 24 * 60 * 60 * 1000;

                        stripeCharges.forEach((charge) => {
                          const createdMs = charge.created * 1000;
                          if (createdMs < sevenDaysAgoMs) return;
                          const d = new Date(createdMs);
                          const key = d.toISOString().slice(0, 10);
                          const index = dayKeys.indexOf(key);
                          if (index === -1) return;

                          const isSuccess =
                            charge.paid && charge.status === 'succeeded';
                          if (isSuccess) {
                            days[index].success += 1;
                          } else {
                            days[index].failed += 1;
                          }
                        });

                        const maxValue = Math.max(
                          1,
                          ...days.map((d) => d.success + d.failed)
                        );

                        return days.map((day, index) => {
                          const baseSuccess = day.success / maxValue;
                          const baseFailed = day.failed / maxValue;

                          // Exaggerate heights so low volumes are still visible
                          const successHeight =
                            baseSuccess > 0 ? 40 + baseSuccess * 60 : 0; // 40–100%
                          const failedHeight =
                            baseFailed > 0 ? 25 + baseFailed * 45 : 0; // 25–70%

                          const successMin = day.success > 0 ? 16 : 0;
                          const failedMin = day.failed > 0 ? 10 : 0;

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center justify-end gap-0.5"
                            >
                              <div className="w-full flex flex-col-reverse gap-0.5">
                                <div
                                  className="w-full bg-slate-900 rounded-t"
                                  style={{
                                    height: `${successHeight}%`,
                                    minHeight: `${successMin}px`,
                                  }}
                                />
                                <div
                                  className="w-full bg-slate-300 rounded-t"
                                  style={{
                                    height: `${failedHeight}%`,
                                    minHeight: `${failedMin}px`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 mt-2">
                                {day.label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-900 rounded" />
                        <span>Success</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-300 rounded" />
                        <span>Failed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Critical Alerts - surfaced near live Stripe data */}
                <div className="card p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">
                    Critical Alerts
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const baseAlerts = [
                        {
                          type: 'critical' as const,
                          message: 'Checkout error detected on mobile',
                          time: '2h ago',
                        },
                        {
                          type: 'warning' as const,
                          message: 'Failed payments increased by 15%',
                          time: '5h ago',
                        },
                        {
                          type: 'critical' as const,
                          message: 'Webhook failure detected',
                          time: '1d ago',
                        },
                      ];

                      const items = [...baseAlerts];

                      if (
                        failureReasons &&
                        failureReasons.reasons &&
                        failureReasons.reasons.length &&
                        failureReasons.totalFailedAmount &&
                        failureReasons.currency
                      ) {
                        const currency = (failureReasons.currency || '').toUpperCase();
                        const topReasons = failureReasons.reasons.slice(0, 3);
                        const reasonAlerts = topReasons.map((r) => ({
                          type: 'critical' as const,
                          message: `${r.count} failed payment${
                            r.count !== 1 ? 's' : ''
                          } due ${r.reason.replace(/_/g, ' ') || 'card issue'} (${(
                            r.amount / 100
                          ).toFixed(2)} ${currency} at risk)`,
                          time: 'recently',
                        }));
                        items.unshift(...reasonAlerts);
                      }

                      return items.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border ${
                            alert.type === 'critical'
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    alert.type === 'critical'
                                      ? 'bg-slate-900'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                <span className="text-sm font-medium text-slate-900">
                                  {alert.message}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-500">
                              {alert.time}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            )}

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
                          <td
                            className="px-4 py-2 text-slate-700 cursor-pointer hover:bg-slate-50"
                            onClick={() => setSelectedCharge(charge)}
                          >
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2 text-slate-900 font-medium cursor-pointer hover:bg-slate-50" onClick={() => setSelectedCharge(charge)}>
                            {amount} {currency}
                          </td>
                          <td className="px-4 py-2 text-slate-600 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedCharge(charge)}>
                            {charge.customer || '—'}
                          </td>
                          <td className="px-4 py-2 cursor-pointer hover:bg-slate-50" onClick={() => setSelectedCharge(charge)}>
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
                          <tr
                            key={charge.id}
                            className="border-t border-amber-100 cursor-pointer hover:bg-amber-50/80"
                            onClick={() => setSelectedCharge(charge)}
                          >
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
                        <tr
                          key={sub.id}
                          className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                          onClick={() => setSelectedSubscription(sub)}
                        >
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

        {/* MRR by Plan */}
        {stripeStatus === 'connected' && stripeSubscriptionsStatus === 'loaded' && mrrByPlan.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">MRR by Plan</h2>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {mrrByPlan.map((plan) => (
                    <tr key={`${plan.label}-${plan.currency}`} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{plan.label}</td>
                      <td className="px-4 py-2 text-slate-900 font-medium">
                        {(plan.mrr / 100).toFixed(2)} {plan.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Churn Candidates */}
        {stripeStatus === 'connected' &&
          stripeSubscriptionsStatus === 'loaded' &&
          churnCandidates.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Churn Candidates</h2>
              <p className="text-sm text-slate-500 mb-3">
                Subscriptions that have been cancelled or set to cancel at the end of the period.
              </p>
              <div className="overflow-x-auto border border-amber-100 rounded-xl bg-amber-50/40">
                <table className="min-w-full text-sm">
                  <thead className="bg-amber-50 border-b border-amber-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">
                        Plan
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">
                        Next Billing
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnCandidates.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-amber-100 cursor-pointer hover:bg-amber-50/80"
                        onClick={() =>
                          setSelectedSubscription(
                            stripeSubscriptions.find((s) => s.id === c.id) || null
                          )
                        }
                      >
                        <td className="px-4 py-2 text-amber-900">{c.customer}</td>
                        <td className="px-4 py-2 text-amber-900">{c.plan}</td>
                        <td className="px-4 py-2 text-amber-900">{c.status}</td>
                        <td className="px-4 py-2 text-amber-900">{c.nextBilling}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Charge detail modal */}
        {selectedCharge && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Charge details</div>
                  <div className="text-xs text-slate-500 truncate">{selectedCharge.id}</div>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                  onClick={() => setSelectedCharge(null)}
                >
                  ×
                </button>
              </div>
              <div className="px-5 py-4 space-y-3 overflow-y-auto text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium text-slate-900">
                    {(selectedCharge.amount / 100).toFixed(2)}{' '}
                    {(selectedCharge.currency || '').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-slate-900">
                    {selectedCharge.paid && selectedCharge.status === 'succeeded'
                      ? 'Succeeded'
                      : 'Failed'}
                  </span>
                </div>
                {selectedCharge.customer && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Customer</span>
                    <span className="text-slate-900">{selectedCharge.customer}</span>
                  </div>
                )}
                {selectedCharge.failure_message && (
                  <div>
                    <div className="text-slate-500 mb-1">Failure reason</div>
                    <div className="text-red-600 text-xs">{selectedCharge.failure_message}</div>
                  </div>
                )}
                <div>
                  <div className="text-slate-500 mb-1 text-xs">Raw data</div>
                  <pre className="text-[11px] bg-slate-50 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(selectedCharge, null, 2)}
                  </pre>
                </div>
                <a
                  href={`https://dashboard.stripe.com/${process.env.NODE_ENV === 'production' ? '' : 'test/'}payments/${selectedCharge.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  Open in Stripe
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Subscription detail modal */}
        {selectedSubscription && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Subscription details</div>
                  <div className="text-xs text-slate-500 truncate">{selectedSubscription.id}</div>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                  onClick={() => setSelectedSubscription(null)}
                >
                  ×
                </button>
              </div>
              <div className="px-5 py-4 space-y-3 overflow-y-auto text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-slate-900">{selectedSubscription.status}</span>
                </div>
                {selectedSubscription.customerName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Customer</span>
                    <span className="text-slate-900">
                      {selectedSubscription.customerName || selectedSubscription.customerEmail}
                    </span>
                  </div>
                )}
                <div>
                  <div className="text-slate-500 mb-1 text-xs">Raw data</div>
                  <pre className="text-[11px] bg-slate-50 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(selectedSubscription, null, 2)}
                  </pre>
                </div>
                <a
                  href={`https://dashboard.stripe.com/${process.env.NODE_ENV === 'production' ? '' : 'test/'}subscriptions/${selectedSubscription.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  Open in Stripe
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Show appropriate dashboard based on plan */}
        {packageType && (
          <>
            {packageType === 'starter' && (
              <StarterDashboard
                overviewSuccessful={
                  stripeSummary
                    ? stripeSummary.totalCount - stripeSummary.failedCount
                    : undefined
                }
                overviewFailed={stripeSummary?.failedCount}
                overviewRevenue={
                  stripeSummary?.totalVolume
                    ? stripeSummary.totalVolume / 100
                    : undefined
                }
                overviewSuccessRatePct={healthMetrics?.successRatePct}
                overviewRangeLabel={
                  stripeRangeDays === 365
                    ? '12 months'
                    : stripeRangeDays === 180
                    ? '6 months'
                    : `${stripeRangeDays} days`
                }
                trendDays={(() => {
                  const days: { label: string; success: number; failed: number }[] = [];
                  const now = new Date();
                  const dayKeys: string[] = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    dayKeys.push(key);
                    days.push({
                      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
                      success: 0,
                      failed: 0,
                    });
                  }

                  const sevenDaysAgoMs =
                    now.getTime() - 7 * 24 * 60 * 60 * 1000;

                  stripeCharges.forEach((charge) => {
                    const createdMs = charge.created * 1000;
                    if (createdMs < sevenDaysAgoMs) return;
                    const d = new Date(createdMs);
                    const key = d.toISOString().slice(0, 10);
                    const index = dayKeys.indexOf(key);
                    if (index === -1) return;

                    const isSuccess =
                      charge.paid && charge.status === 'succeeded';
                    if (isSuccess) {
                      days[index].success += 1;
                    } else {
                      days[index].failed += 1;
                    }
                  });

                  return days;
                })()}
                failureReasons={failureReasons?.reasons}
                failureTotalAmount={failureReasons?.totalFailedAmount}
                failureCurrency={failureReasons?.currency}
                failureRangeLabel={
                  stripeRangeDays >= 30 ? '30 days' : '7 days'
                }
              />
            )}
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

