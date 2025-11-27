import React from 'react';

type PaymentHealthCardProps = {
  healthScore?: number;
  successRatePct?: number;
  failureRatePct?: number;
  successfulPayments?: number;
  failedPayments?: number;
  rangeLabel?: string;
};

const PaymentHealthCard: React.FC<PaymentHealthCardProps> = ({
  healthScore = 87,
  successRatePct = 94.2,
  failureRatePct = 5.8,
  successfulPayments = 342,
  failedPayments = 21,
  rangeLabel,
}) => {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Payment Health Score</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-4xl font-bold text-slate-900 mb-2">{healthScore}</div>
          <div className="text-sm text-slate-600">Overall Score</div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-900 mb-2">
            {successRatePct.toFixed(2)}%
          </div>
          <div className="text-sm text-slate-600">Success Rate</div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${successRatePct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-900 mb-2">
            {failureRatePct.toFixed(2)}%
          </div>
          <div className="text-sm text-slate-600">Failure Rate</div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-300 transition-all"
              style={{ width: `${failureRatePct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="text-sm text-slate-600">
          {rangeLabel ? `Last ${rangeLabel} summary` : 'Last 7 days summary'}
        </div>
        <div className="mt-2 text-sm text-slate-900">
          {successfulPayments} successful, {failedPayments} failed payments
        </div>
      </div>
    </div>
  );
};

export default PaymentHealthCard;


