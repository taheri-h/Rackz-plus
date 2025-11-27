import React from 'react';
import IntegrationsSection from './IntegrationsSection';

type StarterDashboardProps = {
  healthScore?: number;
  successRatePct?: number;
  failureRatePct?: number;
  successfulPayments?: number;
  failedPayments?: number;
  rangeLabel?: string;
};

const StarterDashboard: React.FC<StarterDashboardProps> = ({
  healthScore,
  successRatePct,
  failureRatePct,
  successfulPayments,
  failedPayments,
  rangeLabel,
}) => {
  // Fallback mock data when real metrics are not provided
  const computedHealthScore = healthScore ?? 87;
  const computedSuccessRate = successRatePct ?? 94.2;
  const computedFailureRate = failureRatePct ?? 5.8;
  const totalRevenue = 12450;
  const computedSuccessfulPayments = successfulPayments ?? 342;
  const computedFailedPayments = failedPayments ?? 21;

  const last7Days = [
    { day: 'Mon', success: 45, failed: 3 },
    { day: 'Tue', success: 52, failed: 2 },
    { day: 'Wed', success: 48, failed: 4 },
    { day: 'Thu', success: 51, failed: 3 },
    { day: 'Fri', success: 55, failed: 2 },
    { day: 'Sat', success: 47, failed: 3 },
    { day: 'Sun', success: 44, failed: 4 },
  ];

  const alerts = [
    { type: 'critical', message: 'Checkout error detected on mobile', time: '2h ago' },
    { type: 'warning', message: 'Failed payments increased by 15%', time: '5h ago' },
    { type: 'critical', message: 'Webhook failure detected', time: '1d ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Payment Health Score */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Payment Health Score</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{computedHealthScore}</div>
            <div className="text-sm text-slate-600">Overall Score</div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${computedHealthScore}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900 mb-2">
              {computedSuccessRate.toFixed(2)}%
            </div>
            <div className="text-sm text-slate-600">Success Rate</div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${computedSuccessRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900 mb-2">
              {computedFailureRate.toFixed(2)}%
            </div>
            <div className="text-sm text-slate-600">Failure Rate</div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-300 transition-all"
                style={{ width: `${computedFailureRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-sm text-slate-600">
            {rangeLabel ? `Last ${rangeLabel} summary` : 'Last 7 days summary'}
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {computedSuccessfulPayments} successful, {computedFailedPayments} failed payments
          </div>
        </div>
      </div>

      {/* Payments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Payments Overview (7 days)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Successful</span>
              <span className="text-lg font-semibold text-slate-900">{computedSuccessfulPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Failed</span>
              <span className="text-lg font-semibold text-slate-900">{computedFailedPayments}</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Revenue</span>
                <span className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Avg Success Rate</span>
              <span className="text-base font-semibold text-slate-900">
                {computedSuccessRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">7-Day Trend</h3>
          <div className="h-32 flex items-end justify-between gap-1">
            {last7Days.map((day, index) => {
              const maxValue = Math.max(...last7Days.map(d => d.success + d.failed));
              const successHeight = (day.success / maxValue) * 100;
              const failedHeight = (day.failed / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  <div className="w-full flex flex-col-reverse gap-0.5">
                    <div 
                      className="w-full bg-slate-900 rounded-t"
                      style={{ height: `${successHeight}%`, minHeight: '2px' }}
                    />
                    <div 
                      className="w-full bg-slate-300 rounded-t"
                      style={{ height: `${failedHeight}%`, minHeight: failedHeight > 0 ? '2px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-900 rounded"></div>
              <span>Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 rounded"></div>
              <span>Failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Health */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Checkout Health (Basic)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-600 mb-3">Desktop vs Mobile</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Desktop</span>
                  <span className="font-medium text-slate-900">96.2%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: '96.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Mobile</span>
                  <span className="font-medium text-slate-900">92.1%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: '92.1%' }} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-3">Checkout Errors</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">8</div>
            <div className="text-xs text-slate-500">Last 7 days</div>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-600">⚠️ API key misconfiguration detected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Critical Alerts</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
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
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'critical' ? 'bg-slate-900' : 'bg-slate-400'
                    }`} />
                    <span className="text-sm font-medium text-slate-900">{alert.message}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agent */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">AI Payment Agent (Limited)</h3>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-900 mb-2">What failed?</div>
            <div className="text-xs text-slate-600">8 checkout errors on mobile devices. Primary cause: API key misconfiguration.</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-sm text-slate-900 mb-2">Why did it fail?</div>
            <div className="text-xs text-slate-600">Mobile checkout requests are being rejected due to incorrect API key permissions.</div>
          </div>
          <div className="mt-4">
            <a 
              href="#pricing" 
              className="block w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-center text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Start now
            </a>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <IntegrationsSection plan="starter" />
    </div>
  );
};

export default StarterDashboard;

