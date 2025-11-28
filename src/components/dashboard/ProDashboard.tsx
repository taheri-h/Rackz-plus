import React, { useState } from 'react';
import StarterDashboard from './StarterDashboard';
import IntegrationsSection from './IntegrationsSection';
import DashboardMetricsCards from './DashboardMetricsCards';

type TrendDay = {
  label: string;
  success: number;
  failed: number;
};

type ProDashboardProps = {
  // Loading states
  renewalMetricsStatus?: 'idle' | 'loading' | 'loaded' | 'error';
  disputesStatus?: 'idle' | 'loading' | 'loaded' | 'error';
  // Starter dashboard props
  overviewSuccessful?: number;
  overviewFailed?: number;
  overviewRevenue?: number;
  overviewSuccessRatePct?: number;
  overviewRangeLabel?: string;
  trendDays?: TrendDay[];
  failureReasons?: { reason: string; count: number; amount: number }[];
  failureTotalAmount?: number;
  failureCurrency?: string | null;
  failureRangeLabel?: string;
  // Pro-specific data
  renewalMetrics?: {
    upcomingRenewals: number;
    failedRenewals: number;
    atRiskCustomers: number;
    cardExpirations: number;
    activeSubscribers: number;
    cancellations: number;
    mrr: number;
    mrrAtRisk: number;
    mrrRiskPercentage: number;
    renewalSuccessRate: number;
    predictedFailures: number;
    highRiskCustomersCount: number;
    highRiskCustomers?: Array<{
      customerId: string;
      subscriptionId: string;
      riskScore: number;
      factors: string[];
      mrr: number;
    }>;
    dunningInsights?: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      action: string;
      actionLabel: string;
      affectedSubscriptions: string[];
      affectedCount: number;
      mrrAtRisk: number;
    }>;
  };
  disputes?: {
    summary: {
      total: number;
      statusCounts: {
        new: number;
        evidence: number;
        won: number;
        lost: number;
      };
      totalAmount: number;
      wonAmount: number;
      lostAmount: number;
      winRate: number;
      evidenceDueCount: number;
    };
    disputes?: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      reason: string;
      created: number;
      evidenceDueBy: number | null;
      chargeId: string;
    }>;
  };
};

const ProDashboard: React.FC<ProDashboardProps> = ({
  renewalMetricsStatus = 'idle',
  disputesStatus = 'idle',
  overviewSuccessful,
  overviewFailed,
  overviewRevenue,
  overviewSuccessRatePct,
  overviewRangeLabel,
  trendDays,
  failureReasons,
  failureTotalAmount,
  failureCurrency,
  failureRangeLabel,
  renewalMetrics,
  disputes,
}) => {
  // Use real data or fallback to defaults
  const mrr = renewalMetrics?.mrr || 0;
  const renewalSuccessRate = renewalMetrics?.renewalSuccessRate || 0;
  const activeSubscribers = renewalMetrics?.activeSubscribers || 0;
  const cancellations = renewalMetrics?.cancellations || 0;
  const atRiskCustomers = renewalMetrics?.atRiskCustomers || 0;
  const upcomingExpirations = renewalMetrics?.cardExpirations || 0;
  const upcomingRenewals = renewalMetrics?.upcomingRenewals || 0;
  const failedRenewals = renewalMetrics?.failedRenewals || 0;
  const predictedFailures = renewalMetrics?.predictedFailures || 0;
  const mrrAtRisk = renewalMetrics?.mrrAtRisk || 0;
  const mrrRiskPercentage = renewalMetrics?.mrrRiskPercentage || 0;
  const highRiskCustomersCount = renewalMetrics?.highRiskCustomersCount || 0;
  const highRiskCustomers = renewalMetrics?.highRiskCustomers || [];
  const dunningInsights = renewalMetrics?.dunningInsights || [];

  // Filter state for disputes table
  const [disputeFilter, setDisputeFilter] = useState<string>('all');

  // Filter disputes based on selected status
  const filteredDisputes = disputes?.disputes?.filter((dispute) => {
    if (disputeFilter === 'all') return true;
    if (disputeFilter === 'active') {
      return ['needs_response', 'warning_needs_response', 'under_review', 'warning_under_review'].includes(dispute.status);
    }
    if (disputeFilter === 'won') return dispute.status === 'won';
    if (disputeFilter === 'lost') return dispute.status === 'lost' || dispute.status === 'charge_refunded';
    return dispute.status === disputeFilter;
  }) || [];

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    if (renewalMetricsStatus === 'loaded') {
      console.log('📊 Pro Dashboard Data:', {
        dunningInsightsCount: dunningInsights.length,
        dunningInsights: dunningInsights,
        failedRenewals,
        atRiskCustomers,
        highRiskCustomersCount,
      });
    }
    if (disputesStatus === 'loaded') {
      console.log('💳 Disputes Data:', {
        disputesCount: disputes?.disputes?.length || 0,
        disputes: disputes?.disputes,
        summary: disputes?.summary,
      });
    }
  }

  // Mock renewal predictions for now (can be enhanced with real prediction logic)
  const renewalPredictions = [
    { day: 'Mon', predicted: Math.max(1, Math.round(predictedFailures * 0.15)), actual: 0 },
    { day: 'Tue', predicted: Math.max(1, Math.round(predictedFailures * 0.18)), actual: 0 },
    { day: 'Wed', predicted: Math.max(1, Math.round(predictedFailures * 0.20)), actual: 0 },
    { day: 'Thu', predicted: Math.max(1, Math.round(predictedFailures * 0.15)), actual: 0 },
    { day: 'Fri', predicted: Math.max(1, Math.round(predictedFailures * 0.18)), actual: 0 },
    { day: 'Sat', predicted: Math.max(1, Math.round(predictedFailures * 0.08)), actual: 0 },
    { day: 'Sun', predicted: Math.max(1, Math.round(predictedFailures * 0.06)), actual: 0 },
  ];

  const chargebacks = disputes?.summary.statusCounts
    ? [
        { status: 'new', count: disputes.summary.statusCounts.new },
        { status: 'evidence', count: disputes.summary.statusCounts.evidence },
        { status: 'won', count: disputes.summary.statusCounts.won },
        { status: 'lost', count: disputes.summary.statusCounts.lost },
      ]
    : [
        { status: 'new', count: 0 },
        { status: 'evidence', count: 0 },
        { status: 'won', count: 0 },
        { status: 'lost', count: 0 },
      ];

  const winRate = disputes?.summary.winRate || 0;
  const evidenceDueCount = disputes?.summary.evidenceDueCount || 0;

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <DashboardMetricsCards />
      
      {/* Starter Dashboard with all Starter features */}
      <StarterDashboard
        overviewSuccessful={overviewSuccessful}
        overviewFailed={overviewFailed}
        overviewRevenue={overviewRevenue}
        overviewSuccessRatePct={overviewSuccessRatePct}
        overviewRangeLabel={overviewRangeLabel}
        trendDays={trendDays}
        failureReasons={failureReasons}
        failureTotalAmount={failureTotalAmount}
        failureCurrency={failureCurrency}
        failureRangeLabel={failureRangeLabel}
      />

      {/* Subscription Renewal Health */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Subscription Renewal Health</h2>
        {renewalMetricsStatus === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-600 mt-2">Loading renewal data...</p>
          </div>
        )}
        {renewalMetricsStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">Failed to load renewal data. Please try refreshing the page.</p>
          </div>
        )}
        {renewalMetricsStatus === 'loaded' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-600 mb-1">Upcoming Renewals</div>
            <div className="text-2xl font-bold text-slate-900">{upcomingRenewals}</div>
            <div className="text-xs text-slate-500 mt-1">Next 7 days</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-600 mb-1">Failed Renewals</div>
            <div className="text-2xl font-bold text-slate-900">{failedRenewals}</div>
            <div className="text-xs text-slate-500 mt-1">Last 7 days</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-600 mb-1">At-Risk Customers</div>
            <div className="text-2xl font-bold text-slate-900">{atRiskCustomers}</div>
            <div className="text-xs text-slate-500 mt-1">Requires attention</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-600 mb-1">Card Expirations</div>
            <div className="text-2xl font-bold text-slate-900">{upcomingExpirations}</div>
            <div className="text-xs text-slate-500 mt-1">Next 30 days</div>
          </div>
        </div>
        {dunningInsights.length > 0 ? (
          <div className="space-y-3">
            {dunningInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  insight.priority === 'high'
                    ? 'bg-red-50 border-red-200'
                    : insight.priority === 'medium'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      insight.priority === 'high' ? 'text-red-900' : 
                      insight.priority === 'medium' ? 'text-orange-900' : 
                      'text-slate-900'
                    }`}>
                      {insight.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      insight.priority === 'high' ? 'text-red-700' : 
                      insight.priority === 'medium' ? 'text-orange-700' : 
                      'text-slate-600'
                    }`}>
                      {insight.description}
                    </div>
                  </div>
                  {insight.priority === 'high' && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-200 text-red-900 rounded">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Action handler - can be enhanced to actually perform actions
                      const stripeBaseUrl = 'https://dashboard.stripe.com/test';
                      if (insight.action === 'send_card_update_email') {
                        // In production, this would trigger an email or API call
                        alert(`Action: ${insight.actionLabel}\nAffected: ${insight.affectedCount} subscription(s)\n\nIn production, this would send card update emails to customers.`);
                      } else if (insight.action === 'retry_payment') {
                        alert(`Action: ${insight.actionLabel}\nAffected: ${insight.affectedCount} subscription(s)\n\nIn production, this would schedule payment retries.`);
                      } else if (insight.action === 'contact_customer') {
                        window.open(`${stripeBaseUrl}/subscriptions`, '_blank');
                        alert(`Opening Stripe dashboard to review ${insight.affectedCount} past due subscription(s).`);
                      } else {
                        window.open(`${stripeBaseUrl}/subscriptions`, '_blank');
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      insight.priority === 'high'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : insight.priority === 'medium'
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {insight.actionLabel}
                  </button>
                  <a
                    href={`https://dashboard.stripe.com/test/subscriptions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    View in Stripe
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm font-medium text-slate-900 mb-2">Smart Dunning Suggestions</div>
            <div className="text-xs text-slate-600">
              No immediate actions needed. All renewals are healthy.
            </div>
          </div>
        )}
          </>
        )}
        {renewalMetricsStatus === 'idle' && (
          <div className="text-center py-4 text-slate-500 text-xs">
            Renewal data will load shortly...
          </div>
        )}
      </div>

      {/* Renewal Failure Prediction */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Renewal Failure Prediction (AI)</h3>
        {renewalMetricsStatus === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
            <p className="text-xs text-slate-600 mt-2">Loading predictions...</p>
          </div>
        )}
        {renewalMetricsStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-700">Unable to load predictions</p>
          </div>
        )}
        {renewalMetricsStatus === 'loaded' && (
          <>
            <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">Predicted failures in next 7 days</div>
          <div className="text-2xl font-bold text-slate-900">{predictedFailures} customer{predictedFailures !== 1 ? 's' : ''}</div>
        </div>
        <div className="h-32 flex items-end justify-between gap-1">
          {renewalPredictions.map((day, index) => {
            const maxValue = Math.max(...renewalPredictions.map(d => Math.max(d.predicted, d.actual)));
            const predictedHeight = (day.predicted / maxValue) * 100;
            const actualHeight = (day.actual / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full flex items-end justify-center gap-0.5">
                  <div 
                    className="w-1/2 bg-slate-300 rounded-t"
                    style={{ height: `${predictedHeight}%`, minHeight: '2px' }}
                    title={`Predicted: ${day.predicted}`}
                  />
                  <div 
                    className="w-1/2 bg-slate-900 rounded-t"
                    style={{ height: `${actualHeight}%`, minHeight: '2px' }}
                    title={`Actual: ${day.actual}`}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded"></div>
            <span>Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-900 rounded"></div>
            <span>Actual</span>
          </div>
        </div>
          </>
        )}
        {renewalMetricsStatus === 'idle' && (
          <div className="text-center py-4 text-slate-500 text-xs">
            Prediction data will load shortly...
          </div>
        )}
      </div>

      {/* Subscription KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Subscription KPIs</h3>
          {renewalMetricsStatus === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              <p className="text-xs text-slate-600 mt-2">Loading KPIs...</p>
            </div>
          )}
          {renewalMetricsStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700">Unable to load subscription KPIs</p>
            </div>
          )}
          {renewalMetricsStatus === 'loaded' && (
            <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">MRR</span>
              <span className="text-xl font-bold text-slate-900">${(mrr / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {mrrAtRisk > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">MRR at Risk</span>
                <span className={`text-lg font-semibold ${mrrRiskPercentage > 10 ? 'text-red-600' : mrrRiskPercentage > 5 ? 'text-orange-600' : 'text-slate-900'}`}>
                  ${(mrrAtRisk / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({mrrRiskPercentage.toFixed(1)}%)
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Renewal Success Rate</span>
              <span className="text-lg font-semibold text-slate-900">{renewalSuccessRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Active Subscribers</span>
              <span className="text-lg font-semibold text-slate-900">{activeSubscribers}</span>
            </div>
            {highRiskCustomersCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">High-Risk Customers</span>
                <span className="text-lg font-semibold text-red-600">{highRiskCustomersCount}</span>
              </div>
            )}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Cancellations</span>
                <span className="text-lg font-semibold text-slate-900">{cancellations}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">This month</div>
            </div>
            </div>
          )}
          {renewalMetricsStatus === 'idle' && (
            <div className="text-center py-4 text-slate-500 text-xs">
              KPI data will load shortly...
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Chargeback Watch</h3>
            {disputesStatus === 'loaded' && disputes?.disputes && disputes.disputes.length > 0 && (
              <select
                value={disputeFilter}
                onChange={(e) => setDisputeFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="all">All Disputes ({disputes.disputes.length})</option>
                <option value="active">Active ({disputes.disputes.filter(d => ['needs_response', 'warning_needs_response', 'under_review', 'warning_under_review'].includes(d.status)).length})</option>
                <option value="won">Won ({disputes.disputes.filter(d => d.status === 'won').length})</option>
                <option value="lost">Lost ({disputes.disputes.filter(d => d.status === 'lost' || d.status === 'charge_refunded').length})</option>
              </select>
            )}
          </div>
          {disputesStatus === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              <p className="text-xs text-slate-600 mt-2">Loading chargebacks...</p>
            </div>
          )}
          {disputesStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700">Unable to load chargeback data</p>
            </div>
          )}
          {disputesStatus === 'loaded' && (
            <>
              <div className="space-y-3 mb-4">
                {chargebacks.map((cb, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 capitalize">{cb.status}</span>
                    <span className="text-base font-semibold text-slate-900">{cb.count}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Win Rate</span>
                  <span className="text-lg font-bold text-slate-900">{winRate.toFixed(1)}%</span>
                </div>
                {evidenceDueCount > 0 && (
                  <div className="text-xs text-red-600 font-medium">{evidenceDueCount} evidence due in 3 days</div>
                )}
                {evidenceDueCount === 0 && disputes?.summary.total === 0 && (
                  <div className="text-xs text-slate-500">No active disputes</div>
                )}
              </div>

              {/* Chargeback Details Table */}
              {disputes?.disputes && disputes.disputes.length > 0 ? (
                filteredDisputes.length > 0 ? (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">Dispute Details</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Reason</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Evidence Due</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDisputes.map((dispute) => {
                            const disputeDate = new Date(dispute.created * 1000);
                            const evidenceDueDate = dispute.evidenceDueBy 
                              ? new Date(dispute.evidenceDueBy * 1000)
                              : null;
                            const now = Date.now() / 1000;
                            const daysUntilDue = evidenceDueDate && dispute.evidenceDueBy
                              ? Math.ceil((dispute.evidenceDueBy - now) / (24 * 60 * 60))
                              : null;
                            const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue > 0;
                            const isOverdue = daysUntilDue !== null && daysUntilDue <= 0;

                            const getStatusColor = (status: string) => {
                              if (status === 'won') return 'text-green-600 bg-green-50';
                              if (status === 'lost' || status === 'charge_refunded') return 'text-red-600 bg-red-50';
                              if (status === 'needs_response' || status === 'warning_needs_response') return 'text-orange-600 bg-orange-50';
                              if (status === 'under_review' || status === 'warning_under_review') return 'text-blue-600 bg-blue-50';
                              return 'text-slate-600 bg-slate-50';
                            };

                            return (
                              <tr key={dispute.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-900">
                                  {disputeDate.toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: dispute.currency.toUpperCase(),
                                  }).format(dispute.amount / 100)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(dispute.status)}`}>
                                    {dispute.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600 capitalize">
                                  {dispute.reason ? dispute.reason.replace(/_/g, ' ') : '—'}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  {evidenceDueDate ? (
                                    <div>
                                      <div className={`font-medium ${
                                        isOverdue ? 'text-red-600' : 
                                        isUrgent ? 'text-orange-600' : 
                                        'text-slate-600'
                                      }`}>
                                        {evidenceDueDate.toLocaleDateString()}
                                      </div>
                                      {isOverdue && (
                                        <div className="text-xs text-red-600">Overdue</div>
                                      )}
                                      {isUrgent && !isOverdue && (
                                        <div className="text-xs text-orange-600">{daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <a
                                    href={`https://dashboard.stripe.com/test/disputes/${dispute.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                                  >
                                    View in Stripe
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No disputes found with selected filter
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">No dispute details available</p>
                  </div>
                </div>
              )}
            </>
          )}
          {disputesStatus === 'idle' && (
            <div className="text-center py-4 text-slate-500 text-xs">
              Chargeback data will load shortly...
            </div>
          )}
        </div>
      </div>

      {/* High-Risk Customers */}
      {highRiskCustomersCount > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">High-Risk Customers</h3>
          <div className="mb-4">
            <div className="text-sm text-slate-600 mb-2">
              {highRiskCustomersCount} customer{highRiskCustomersCount !== 1 ? 's' : ''} identified as high-risk
              {mrrAtRisk > 0 && ` ($${(mrrAtRisk / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MRR at risk)`}
            </div>
          </div>
          {highRiskCustomers.length > 0 && (
            <div className="space-y-3">
              {highRiskCustomers.map((customer, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Customer: {customer.customerId.substring(0, 20)}...
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Risk Score: {customer.riskScore} | MRR: ${(customer.mrr / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <a
                      href={`https://dashboard.stripe.com/test/customers/${customer.customerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      View in Stripe
                    </a>
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    <div className="font-medium mb-1">Risk Factors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {customer.factors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Deep Dive */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Checkout Deep Dive</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-600 mb-3">Browser Performance</div>
            <div className="space-y-2">
              {['Chrome', 'Safari', 'Firefox', 'Edge'].map((browser, index) => {
                const rates = [96.5, 94.2, 93.8, 95.1];
                return (
                  <div key={index}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{browser}</span>
                      <span className="font-medium text-slate-900">{rates[index]}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900" style={{ width: `${rates[index]}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-3">Top Decline Reasons</div>
            <div className="space-y-2">
              {[
                { reason: 'Insufficient funds', count: 8 },
                { reason: 'Card expired', count: 5 },
                { reason: 'Invalid card', count: 3 },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">{item.reason}</span>
                  <span className="text-sm font-medium text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Agent Full Mode */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">AI Payment Agent (Full Mode)</h3>
        {renewalMetricsStatus === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
            <p className="text-xs text-slate-600 mt-2">Analyzing payment patterns...</p>
          </div>
        )}
        {renewalMetricsStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-700">Unable to load AI insights</p>
          </div>
        )}
        {renewalMetricsStatus === 'loaded' && (
          <div className="space-y-3">
            {dunningInsights.length > 0 ? (
              <>
                {dunningInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      insight.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : insight.priority === 'medium'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          insight.priority === 'high' ? 'text-red-900' : 
                          insight.priority === 'medium' ? 'text-orange-900' : 
                          'text-slate-900'
                        }`}>
                          {insight.title}
                        </div>
                        <div className={`text-xs mt-1 ${
                          insight.priority === 'high' ? 'text-red-700' : 
                          insight.priority === 'medium' ? 'text-orange-700' : 
                          'text-slate-600'
                        }`}>
                          {insight.description}
                        </div>
                      </div>
                      {insight.priority === 'high' && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-200 text-red-900 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Action handler - can be enhanced to actually perform actions
                          const stripeBaseUrl = 'https://dashboard.stripe.com/test';
                          if (insight.action === 'send_card_update_email') {
                            // In production, this would trigger an email or API call
                            alert(`Action: ${insight.actionLabel}\nAffected: ${insight.affectedCount} subscription(s)\n\nIn production, this would send card update emails to customers.`);
                          } else if (insight.action === 'retry_payment') {
                            alert(`Action: ${insight.actionLabel}\nAffected: ${insight.affectedCount} subscription(s)\n\nIn production, this would schedule payment retries.`);
                          } else if (insight.action === 'contact_customer') {
                            window.open(`${stripeBaseUrl}/subscriptions`, '_blank');
                            alert(`Opening Stripe dashboard to review ${insight.affectedCount} past due subscription(s).`);
                          } else {
                            window.open(`${stripeBaseUrl}/subscriptions`, '_blank');
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          insight.priority === 'high'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : insight.priority === 'medium'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {insight.actionLabel}
                      </button>
                      <a
                        href={`https://dashboard.stripe.com/test/subscriptions`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:text-slate-900 underline"
                      >
                        View in Stripe
                      </a>
                    </div>
                  </div>
                ))}
                {failureReasons && failureReasons.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-sm font-medium text-slate-900 mb-2">Top Decline Code Analysis</div>
                    <div className="text-xs text-slate-600">
                      "{failureReasons[0].reason}" ({failureReasons[0].count} occurrence{failureReasons[0].count !== 1 ? 's' : ''}): 
                      {failureReasons[0].reason === 'insufficient_funds' && ' Customer\'s bank account lacks sufficient funds. Recommend retry after 2-3 days.'}
                      {failureReasons[0].reason === 'expired_card' && ' Customer\'s card has expired. Request updated payment method.'}
                      {failureReasons[0].reason === 'generic_decline' && ' Card was declined by the bank. Contact customer for alternative payment method.'}
                      {!['insufficient_funds', 'expired_card', 'generic_decline'].includes(failureReasons[0].reason) && ' Review payment method and contact customer if needed.'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-sm font-medium text-green-900 mb-2">✅ All Systems Healthy</div>
                <div className="text-xs text-green-700">No immediate actions needed. Your subscription renewals are performing well.</div>
              </div>
            )}
          </div>
        )}
        {renewalMetricsStatus === 'idle' && (
          <div className="text-center py-4 text-slate-500 text-xs">
            AI insights will load shortly...
          </div>
        )}
      </div>

      {/* Integrations */}
      <IntegrationsSection plan="pro" />
    </div>
  );
};

export default ProDashboard;

