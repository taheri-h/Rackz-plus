import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

interface SetupRequest {
  id: string;
  packageName: string;
  packageDisplayName: string;
  price: string;
  company: string;
  email: string;
  name: string;
  phone: string;
  industry: string;
  status: 'payment_pending' | 'payment_completed' | 'in_review' | 'in_progress' | 'testing' | 'completed' | 'on_hold';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  timeline: string;
  preferredContactMethod: string;
  notes?: string;
}

const SetupDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SetupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Load user's setup requests from localStorage/sessionStorage
    // In a real app, this would be an API call
    if (user) {
      loadUserRequests();
    }
  }, [user]);

  const loadUserRequests = () => {
    if (!user) return;
    
    setLoading(true);
    
    // Get user-specific setup requests from localStorage
    // In production, this would fetch from an API
    const allRequests: SetupRequest[] = [];
    
    // Use user-specific key for storage
    const userStorageKey = `userSetupRequests_${user.id}`;
    const savedRequests = localStorage.getItem(userStorageKey);
    if (savedRequests) {
      const parsed = JSON.parse(savedRequests);
      // Filter by current user's email to ensure only their requests
      const userRequests = parsed.filter((r: SetupRequest) => r.email === user.email);
      allRequests.push(...userRequests);
    }

    // Also check for current payment data in sessionStorage (if not already in localStorage)
    const paymentData = sessionStorage.getItem('setupPaymentData');
    if (paymentData) {
      const data = JSON.parse(paymentData);
      // Only add if it belongs to the current user
      if (data.email === user.email) {
        const exists = allRequests.find(r => r.email === data.email && r.packageName === data.package);
        if (!exists) {
          allRequests.push({
            id: `request-${Date.now()}`,
            packageName: data.package || 'checkout',
            packageDisplayName: data.packageName || 'Stripe Checkout Setup',
            price: data.price || '$299',
            company: data.company || '',
            email: data.email || '',
            name: data.name || '',
            phone: data.phone || '',
            industry: data.industry || '',
            status: 'payment_completed',
            paymentDate: data.paymentDate || new Date().toISOString(),
            createdAt: data.paymentDate || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timeline: data.timeline || '',
            preferredContactMethod: data.preferredContactMethod || 'email',
            notes: 'Payment completed. Setup will begin within 2-7 business days.'
          });
        }
      }
    }

    // Save to user-specific localStorage for persistence
    if (allRequests.length > 0) {
      localStorage.setItem(userStorageKey, JSON.stringify(allRequests));
    }

    setRequests(allRequests);
    setLoading(false);
  };

  const getStatusColor = (status: SetupRequest['status']) => {
    switch (status) {
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_completed':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-slate-900 text-white';
      case 'testing':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: SetupRequest['status']) => {
    switch (status) {
      case 'payment_pending':
        return 'Payment Pending';
      case 'payment_completed':
        return 'Payment Completed';
      case 'in_review':
        return 'In Review';
      case 'in_progress':
        return 'In Progress';
      case 'testing':
        return 'Testing';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: SetupRequest['status']) => {
    switch (status) {
      case 'payment_completed':
      case 'in_review':
      case 'in_progress':
      case 'testing':
        return (
          <div className="w-3 h-3 bg-current rounded-full animate-pulse" />
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return (
          <div className="w-3 h-3 bg-current rounded-full" />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading your setup requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>Setup Dashboard | Rackz</title>
        <meta name="description" content="Track all your payment integration setup requests and their progress." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Setup Dashboard</h1>
          <p className="text-slate-600">Track all your payment integration setup requests</p>
        </div>

        {requests.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Setup Requests Yet</h2>
            <p className="text-slate-600 mb-6">Get started by selecting a setup package</p>
            <Link to="/setup" className="button-primary inline-block">
              Browse Setup Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left: Request Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          {request.packageDisplayName}
                        </h3>
                        <p className="text-sm text-slate-600">{request.company}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Contact</p>
                        <p className="text-sm font-medium text-slate-900">{request.name}</p>
                        <p className="text-sm text-slate-600">{request.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Timeline</p>
                        <p className="text-sm font-medium text-slate-900">{request.timeline || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-sm font-medium text-slate-900">{request.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Created</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(request.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-sm text-slate-700">{request.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Progress Timeline</h4>
                  <div className="space-y-3">
                    {[
                      { status: 'payment_completed', label: 'Payment Completed', date: request.paymentDate },
                      { status: 'in_review', label: 'In Review' },
                      { status: 'in_progress', label: 'Setup In Progress' },
                      { status: 'testing', label: 'Testing & QA' },
                      { status: 'completed', label: 'Setup Complete' }
                    ].map((step, index) => {
                      const isActive = ['payment_completed', 'in_review', 'in_progress', 'testing', 'completed'].indexOf(request.status) >= index;
                      const isCurrent = step.status === request.status;
                      
                      return (
                        <div key={step.status} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-slate-900' : 'bg-slate-200'
                          }`}>
                            {isActive ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.label}
                              {isCurrent && <span className="ml-2 text-xs text-slate-600">(Current)</span>}
                            </p>
                            {step.date && isActive && (
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(step.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/setup"
            className="flex-1 px-6 py-3 button-primary text-center"
          >
            Request New Setup
          </Link>
          <Link
            to="/"
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium text-center hover:bg-slate-50 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupDashboard;

