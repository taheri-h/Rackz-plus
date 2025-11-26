import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

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
  businessType: string;
  website: string;
  country: string;
  status: 'payment_pending' | 'payment_completed' | 'in_review' | 'in_progress' | 'testing' | 'completed' | 'on_hold';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  timeline: string;
  preferredContactMethod: string;
  currentPaymentProvider: string;
  platform: string;
  crm?: string;
  additionalRequirements?: string;
  notes?: string;
  adminNotes?: string;
}

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<SetupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SetupRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Simple password protection (in production, use proper authentication)
  const ADMIN_PASSWORD = 'admin123'; // Change this in production

  useEffect(() => {
    window.scrollTo(0, 0);
    // Check if already authenticated
    const auth = sessionStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadAllRequests();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      loadAllRequests();
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

  const loadAllRequests = () => {
    setLoading(true);
    
    // In production, this would be an API call
    // For now, we'll simulate with localStorage
    const allRequests: SetupRequest[] = [];
    
    // Load from localStorage (user requests)
    const userRequests = localStorage.getItem('userSetupRequests');
    if (userRequests) {
      const parsed = JSON.parse(userRequests);
      allRequests.push(...parsed);
    }

    // Also check sessionStorage for recent payments
    const paymentData = sessionStorage.getItem('setupPaymentData');
    if (paymentData) {
      const data = JSON.parse(paymentData);
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
          businessType: data.businessType || '',
          website: data.website || '',
          country: data.country || '',
          status: 'payment_completed',
          paymentDate: data.paymentDate || new Date().toISOString(),
          createdAt: data.paymentDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: data.timeline || '',
          preferredContactMethod: data.preferredContactMethod || 'email',
          currentPaymentProvider: data.currentPaymentProvider || '',
          platform: data.platform || '',
          crm: data.crm || '',
          additionalRequirements: data.additionalRequirements || '',
          notes: 'Payment completed. Setup will begin within 2-7 business days.'
        });
      }
    }

    // Store in admin storage
    localStorage.setItem('adminAllRequests', JSON.stringify(allRequests));
    setRequests(allRequests);
    setLoading(false);
  };

  const updateRequestStatus = (requestId: string, newStatus: SetupRequest['status'], notes?: string) => {
    const updated = requests.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          adminNotes: notes || req.adminNotes,
          notes: notes || req.notes
        };
      }
      return req;
    });
    
    setRequests(updated);
    localStorage.setItem('adminAllRequests', JSON.stringify(updated));
    
    // Also update user's requests
    const userRequests = localStorage.getItem('userSetupRequests');
    if (userRequests) {
      const parsed = JSON.parse(userRequests);
      const updatedUser = parsed.map((req: SetupRequest) => {
        if (req.id === requestId) {
          return {
            ...req,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            notes: notes || req.notes
          };
        }
        return req;
      });
      localStorage.setItem('userSetupRequests', JSON.stringify(updatedUser));
    }
    
    if (selectedRequest?.id === requestId) {
      setSelectedRequest(updated.find(r => r.id === requestId) || null);
    }
  };

  const saveAdminNotes = () => {
    if (selectedRequest) {
      updateRequestStatus(selectedRequest.id, selectedRequest.status, adminNotes);
      setAdminNotes('');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      req.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <Helmet>
          <title>Admin Login | Rackz</title>
        </Helmet>
        <div className="max-w-md w-full px-6">
          <div className="card p-8">
            <h1 className="text-2xl font-semibold text-slate-900 mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <button type="submit" className="w-full button-primary">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <p className="text-slate-600">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <Helmet>
        <title>Admin Dashboard | Rackz</title>
        <meta name="description" content="Admin dashboard for managing setup requests" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Manage all setup requests</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-slate-600 mb-1">Total Requests</p>
            <p className="text-2xl font-semibold text-slate-900">{requests.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-600 mb-1">In Progress</p>
            <p className="text-2xl font-semibold text-slate-900">
              {requests.filter(r => r.status === 'in_progress').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-600 mb-1">Completed</p>
            <p className="text-2xl font-semibold text-slate-900">
              {requests.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-600 mb-1">Pending</p>
            <p className="text-2xl font-semibold text-slate-900">
              {requests.filter(r => r.status === 'payment_pending' || r.status === 'payment_completed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by company, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="payment_completed">Payment Completed</option>
              <option value="in_review">In Review</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-slate-600">No requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`card p-6 cursor-pointer transition-all ${
                    selectedRequest?.id === request.id ? 'border-2 border-slate-900' : ''
                  }`}
                  onClick={() => {
                    setSelectedRequest(request);
                    setAdminNotes(request.adminNotes || '');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {request.packageDisplayName}
                      </h3>
                      <p className="text-sm text-slate-600">{request.company}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium">Contact:</span> {request.name} ({request.email})
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Amount:</span> {request.price}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Request Details & Actions */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="card p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Request Details</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Service</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRequest.packageDisplayName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Company</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRequest.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Contact</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRequest.name}</p>
                    <p className="text-sm text-slate-600">{selectedRequest.email}</p>
                    <p className="text-sm text-slate-600">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Industry</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRequest.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Platform</p>
                    <p className="text-sm font-medium text-slate-900">{selectedRequest.platform}</p>
                  </div>
                  {selectedRequest.crm && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">CRM</p>
                      <p className="text-sm font-medium text-slate-900">{selectedRequest.crm}</p>
                    </div>
                  )}
                  {selectedRequest.additionalRequirements && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Additional Requirements</p>
                      <p className="text-sm text-slate-700">{selectedRequest.additionalRequirements}</p>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as SetupRequest['status'];
                      updateRequestStatus(selectedRequest.id, newStatus);
                      setSelectedRequest({ ...selectedRequest, status: newStatus });
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="payment_pending">Payment Pending</option>
                    <option value="payment_completed">Payment Completed</option>
                    <option value="in_review">In Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                {/* Admin Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Add notes about this request..."
                  />
                  <button
                    onClick={saveAdminNotes}
                    className="mt-2 w-full button-primary"
                  >
                    Save Notes
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${selectedRequest.email}?subject=Re: ${selectedRequest.packageDisplayName} Setup`;
                    }}
                    className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 transition-all"
                  >
                    Email Customer
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = `tel:${selectedRequest.phone}`;
                    }}
                    className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 transition-all"
                  >
                    Call Customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-slate-600">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

