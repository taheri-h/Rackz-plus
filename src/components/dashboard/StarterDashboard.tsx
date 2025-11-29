import React from 'react';

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
  failureReasons?: { reason: string; count: number; amount: number }[];
  failureTotalAmount?: number;
  failureCurrency?: string | null;
  failureRangeLabel?: string;
};

const StarterDashboard: React.FC<StarterDashboardProps> = ({
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
}) => {
  return (
    <div className="space-y-8">
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

    </div>
  );
};

export default StarterDashboard;

