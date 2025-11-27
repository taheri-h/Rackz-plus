import React from 'react';
import IntegrationsSection from './IntegrationsSection';

type TrendDay = {
  label: string;
  success: number;
  failed: number;
};

type StarterDashboardProps = {
  overviewSuccessful?: number;
  overviewFailed?: number;
  overviewRevenue?: number;
  overviewSuccessRatePct?: number;
  overviewRangeLabel?: string;
  trendDays?: TrendDay[];
};

const StarterDashboard: React.FC<StarterDashboardProps> = ({
  overviewSuccessful,
  overviewFailed,
  overviewRevenue,
  overviewSuccessRatePct,
  overviewRangeLabel,
  trendDays,
}) => {
  // Mock defaults - overridden when real metrics are provided
  const totalRevenue = overviewRevenue ?? 12450;
  const successfulPayments = overviewSuccessful ?? 342;
  const failedPayments = overviewFailed ?? 21;
  const successRate = overviewSuccessRatePct ?? 94.2;

  const last7Days =
    trendDays && trendDays.length === 7
      ? trendDays.map((d) => ({ day: d.label, success: d.success, failed: d.failed }))
      : [
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
      {/* Payments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Payments Overview ({overviewRangeLabel ?? '7 days'})
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Successful</span>
              <span className="text-lg font-semibold text-slate-900">{successfulPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Failed</span>
              <span className="text-lg font-semibold text-slate-900">{failedPayments}</span>
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
                {successRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">7-Day Trend</h3>
          <div className="h-32 flex items-end justify-between gap-1">
            {last7Days.map((day, index) => {
              const maxValue = Math.max(
                1,
                ...last7Days.map((d) => d.success + d.failed)
              );
              const successHeight = (day.success / maxValue) * 100;
              const failedHeight = (day.failed / maxValue) * 100;

              const successMin = day.success > 0 ? 10 : 0;
              const failedMin = day.failed > 0 ? 6 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  <div className="w-full flex flex-col-reverse gap-0.5">
                    <div 
                      className="w-full bg-slate-900 rounded-t"
                      style={{ height: `${successHeight}%`, minHeight: `${successMin}px` }}
                    />
                    <div 
                      className="w-full bg-slate-300 rounded-t"
                      style={{ height: `${failedHeight}%`, minHeight: `${failedMin}px` }}
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

