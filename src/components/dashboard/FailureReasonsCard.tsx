import React from 'react';

type FailureReason = {
  reason: string;
  count: number;
  amount: number;
};

type FailureReasonsCardProps = {
  reasons: FailureReason[];
  totalFailedAmount: number;
  currency: string | null;
  rangeLabel: string;
};

const prettifyReason = (reason: string) => {
  if (!reason) return 'Other';
  const map: Record<string, string> = {
    insufficient_funds: 'Insufficient funds',
    do_not_honor: "Do not honor",
    generic_decline: 'Generic decline',
    expired_card: 'Expired card',
    incorrect_cvc: 'Incorrect CVC',
  };
  return map[reason] || reason.replace(/_/g, ' ');
};

const FailureReasonsCard: React.FC<FailureReasonsCardProps> = ({
  reasons,
  totalFailedAmount,
  currency,
  rangeLabel,
}) => {
  if (!reasons || reasons.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
          Failure Reasons & Revenue at Risk
        </h3>
        <p className="text-sm text-slate-500">
          No failed payments in the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-2">
        Failure Reasons &amp; Revenue at Risk
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Last {rangeLabel}: {reasons.reduce((sum, r) => sum + r.count, 0)} failed
        payments,{' '}
        {(totalFailedAmount / 100).toFixed(2)}{' '}
        {(currency || '').toUpperCase()} at risk.
      </p>
      <div className="space-y-2">
        {reasons.slice(0, 5).map((r) => (
          <div
            key={r.reason}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex flex-col">
              <span className="text-slate-900 font-medium">
                {prettifyReason(r.reason)}
              </span>
              <span className="text-xs text-slate-500">
                {r.count} failed payment{r.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-right">
              <div className="text-slate-900 font-semibold">
                {(r.amount / 100).toFixed(2)}{' '}
                {(currency || '').toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailureReasonsCard;


