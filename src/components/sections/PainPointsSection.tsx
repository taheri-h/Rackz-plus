import React from 'react';

const PainPointsSection: React.FC = () => {

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* PAIN SECTION — WHY FOUNDERS NEED RACKZ */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-3 leading-tight tracking-tight">
            Payments break silently. You only notice when revenue drops.
          </h2>
        </div>

        {/* Across thousands of Stripe/PayPal businesses */}
        <div className="mb-12 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Across thousands of Stripe/PayPal businesses:
          </p>
          <ul className="space-y-3 text-base text-slate-700">
            <li className="flex items-baseline gap-4">
              <span className="text-2xl font-semibold text-slate-900 min-w-[96px]">4–8%</span>
              <span className="text-slate-700">of payments fail silently.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="text-2xl font-semibold text-slate-900 min-w-[96px]">15–30%</span>
              <span className="text-slate-700">of subscriptions churn involuntarily.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="text-2xl font-semibold text-slate-900 min-w-[96px]">1 in 20</span>
              <span className="text-slate-700">checkouts fail due to integration issues.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="text-lg font-semibold text-slate-900 min-w-[96px]">Payouts</span>
              <span className="text-slate-700">stall because of KYC restrictions.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="text-lg font-semibold text-slate-900 min-w-[96px]">Webhooks</span>
              <span className="text-slate-700">fail without warning.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="text-lg font-semibold text-slate-900 min-w-[96px]">Apple/Google Pay</span>
              <span className="text-slate-700">break silently.</span>
            </li>
          </ul>
        </div>

        {/* If you're not monitoring */}
        <div className="mb-12 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            If you're not monitoring:
          </p>
          <ul className="space-y-2 text-base text-slate-700">
            <li className="flex items-baseline gap-4">
              <span className="font-semibold text-slate-900 min-w-[140px]">You lose revenue</span>
              <span className="text-slate-700">on payments that should have succeeded.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="font-semibold text-slate-900 min-w-[140px]">You don’t know why</span>
              <span className="text-slate-700">MRR, LTV, or cash flow suddenly dip.</span>
            </li>
            <li className="flex items-baseline gap-4">
              <span className="font-semibold text-slate-900 min-w-[140px]">You find out too late</span>
              <span className="text-slate-700">when customers complain or churn shows up in reports.</span>
            </li>
          </ul>
        </div>

        {/* Transition */}
        <div>
          <p className="text-lg text-slate-900 font-medium">
            Rackz monitors all of this for you, automatically.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
