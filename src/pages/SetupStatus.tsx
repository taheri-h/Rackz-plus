import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

const SetupStatus: React.FC = () => {
  const { packageName } = useParams<{ packageName: string }>();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<any>(null);

  const packageInfo: Record<string, { name: string; price: string }> = {
    'checkout': { name: 'Stripe Checkout Setup', price: '$299' },
    'subscriptions': { name: 'Subscriptions Setup', price: '$749' },
    'crm': { name: 'CRM Integration', price: '$1499' },
    'marketplace': { name: 'Marketplace Setup', price: 'from $1999' }
  };

  const currentPackage = packageInfo[packageName || 'checkout'] || packageInfo['checkout'];

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) return;
    
    // Get payment data from user-specific sessionStorage
    const userPaymentKey = `setupPaymentData_${user.id}`;
    const stored = sessionStorage.getItem(userPaymentKey);
    if (stored) {
      const data = JSON.parse(stored);
      // Only use if it belongs to current user
      if (data.email === user.email) {
        setPaymentData(data);
      }
    }
  }, [user]);

  if (!paymentData) {
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
        <title>Setup Status - {currentPackage.name} | Rackz</title>
        <meta name="description" content={`Track the status of your ${currentPackage.name} setup request.`} />
      </Helmet>

      <div className="max-w-2xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Payment Confirmed</h1>
          <p className="text-lg text-slate-600">Your setup request has been received</p>
        </div>

        {/* Status Card */}
        <div className="card p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Setup Status</h2>
            
            {/* Status Timeline */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Payment Completed</h3>
                  <p className="text-sm text-slate-600">Your payment has been successfully processed</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(paymentData.paymentDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Setup in Progress</h3>
                  <p className="text-sm text-slate-600">Our team is preparing your integration</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-slate-400 rounded-full" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-400">Setup Complete</h3>
                  <p className="text-sm text-slate-500">We'll notify you when your setup is ready</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-slate-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">What Happens Next?</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Our team will begin working on your {currentPackage.name} setup. We'll contact you within 2-7 business days to:
                </p>
                <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
                  <li>Review your requirements and technical details</li>
                  <li>Set up and configure your payment integration</li>
                  <li>Perform testing and quality assurance</li>
                  <li>Provide documentation and handover</li>
                </ul>
                <p className="text-sm text-slate-700 mt-4 font-medium">
                  We'll reach out to you via {paymentData.preferredContactMethod === 'email' ? 'email' : paymentData.preferredContactMethod} at {paymentData.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="card p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Service</span>
              <span className="text-slate-900 font-medium">{currentPackage.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Company</span>
              <span className="text-slate-900 font-medium">{paymentData.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Contact</span>
              <span className="text-slate-900 font-medium">{paymentData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amount Paid (50% Upfront)</span>
              <span className="text-slate-900 font-medium">
                {paymentData.upfrontAmount || currentPackage.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Full Price</span>
              <span className="text-slate-600 line-through">
                {paymentData.fullPrice || currentPackage.price}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600">Remaining Balance</span>
              <span className="text-slate-900 font-medium">
                {paymentData.upfrontAmount 
                  ? (paymentData.fullPriceValue 
                      ? `$${(paymentData.fullPriceValue - paymentData.upfrontAmountValue).toFixed(2)}`
                      : 'Due after delivery')
                  : 'Due after delivery'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Order Date</span>
              <span className="text-slate-900 font-medium">
                {new Date(paymentData.paymentDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/setup-dashboard"
            className="flex-1 px-6 py-3 button-primary text-center"
          >
            View Dashboard
          </Link>
          <Link
            to="/setup"
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium text-center hover:bg-slate-50 transition-all"
          >
            Request Another Setup
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 mb-2">Need help or have questions?</p>
          <a
            href="mailto:support@rackz.com"
            className="text-sm font-medium text-slate-900 hover:underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default SetupStatus;

