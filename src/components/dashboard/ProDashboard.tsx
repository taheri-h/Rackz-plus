import React from 'react';
import StarterDashboard from './StarterDashboard';
import IntegrationsSection from './IntegrationsSection';
import DashboardMetricsCards from './DashboardMetricsCards';

type TrendDay = {
  label: string;
  success: number;
  failed: number;
};

type ProDashboardProps = {
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
    renewalSuccessRate: number;
    predictedFailures: number;
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
  };
};

const ProDashboard: React.FC<ProDashboardProps> = ({
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
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-sm font-medium text-slate-900 mb-2">Smart Dunning Suggestions</div>
          <div className="text-xs text-slate-600">
            {failedRenewals > 0 && `Retry ${failedRenewals} failed renewal${failedRenewals !== 1 ? 's' : ''} with updated payment methods. `}
            {atRiskCustomers > 0 && `Contact ${atRiskCustomers} at-risk customer${atRiskCustomers !== 1 ? 's' : ''} before next billing cycle.`}
            {failedRenewals === 0 && atRiskCustomers === 0 && 'No immediate actions needed. All renewals are healthy.'}
          </div>
        </div>
      </div>

      {/* Renewal Failure Prediction */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Renewal Failure Prediction (AI)</h3>
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
      </div>

      {/* Subscription KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Subscription KPIs</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">MRR</span>
              <span className="text-xl font-bold text-slate-900">${mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Renewal Success Rate</span>
              <span className="text-lg font-semibold text-slate-900">{renewalSuccessRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Active Subscribers</span>
              <span className="text-lg font-semibold text-slate-900">{activeSubscribers}</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Cancellations</span>
                <span className="text-lg font-semibold text-slate-900">{cancellations}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">This month</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Chargeback Watch</h3>
          <div className="space-y-3 mb-4">
            {chargebacks.map((cb, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-slate-600 capitalize">{cb.status}</span>
                <span className="text-base font-semibold text-slate-900">{cb.count}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Win Rate</span>
              <span className="text-lg font-bold text-slate-900">{winRate.toFixed(1)}%</span>
            </div>
            {evidenceDueCount > 0 && (
              <div className="text-xs text-slate-500">{evidenceDueCount} evidence due in 3 days</div>
            )}
            {evidenceDueCount === 0 && disputes?.summary.total === 0 && (
              <div className="text-xs text-slate-500">No active disputes</div>
            )}
          </div>
        </div>
      </div>

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
        <div className="space-y-3">
          {failedRenewals > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm font-medium text-slate-900 mb-2">Recommended Retry Logic</div>
              <div className="text-xs text-slate-600">
                Enable automatic retry for {failedRenewals} failed renewal{failedRenewals !== 1 ? 's' : ''}. 
                Suggested: Retry after 3 days with updated payment method.
              </div>
            </div>
          )}
          {atRiskCustomers > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm font-medium text-slate-900 mb-2">Settings to Fix Renewal Failures</div>
              <div className="text-xs text-slate-600">
                Update dunning settings: Enable email notifications 7 days before card expiry. 
                Set up automatic card update flow. {atRiskCustomers} customer{atRiskCustomers !== 1 ? 's are' : ' is'} at risk.
              </div>
            </div>
          )}
          {failureReasons && failureReasons.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm font-medium text-slate-900 mb-2">Top Decline Code Explanation</div>
              <div className="text-xs text-slate-600">
                "{failureReasons[0].reason}" ({failureReasons[0].count} occurrence{failureReasons[0].count !== 1 ? 's' : ''}): 
                {failureReasons[0].reason === 'insufficient_funds' && ' Customer\'s bank account lacks sufficient funds. Recommend retry after 2-3 days.'}
                {failureReasons[0].reason === 'expired_card' && ' Customer\'s card has expired. Request updated payment method.'}
                {failureReasons[0].reason === 'generic_decline' && ' Card was declined by the bank. Contact customer for alternative payment method.'}
                {!['insufficient_funds', 'expired_card', 'generic_decline'].includes(failureReasons[0].reason) && ' Review payment method and contact customer if needed.'}
              </div>
            </div>
          )}
          {failedRenewals === 0 && atRiskCustomers === 0 && (!failureReasons || failureReasons.length === 0) && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm font-medium text-slate-900 mb-2">All Systems Healthy</div>
              <div className="text-xs text-slate-600">No immediate actions needed. Your subscription renewals are performing well.</div>
            </div>
          )}
        </div>
      </div>

      {/* Integrations */}
      <IntegrationsSection plan="pro" />
    </div>
  );
};

export default ProDashboard;

