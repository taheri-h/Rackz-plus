import React from 'react';
import { useTranslation } from 'react-i18next';

const Refund: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('refund.title')}</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            <strong>{t('refund.lastUpdated')}:</strong> {t('refund.lastUpdatedDate')}
          </p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('refund.moneyBackGuarantee')}</h2>
          <p className="text-slate-600 mb-6">
            {t('refund.moneyBackGuaranteeDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('refund.refundEligibility')}</h2>
          <p className="text-slate-600 mb-6">
            {t('refund.refundEligibilityDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('refund.refundProcess')}</h2>
          <p className="text-slate-600 mb-6">
            {t('refund.refundProcessDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('refund.nonRefundableItems')}</h2>
          <p className="text-slate-600 mb-6">
            {t('refund.nonRefundableItemsDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('refund.contactUs')}</h2>
          <p className="text-slate-600 mb-6">
            {t('refund.contactUsDescription')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-slate-600"><strong>{t('refund.email')}:</strong> info@rackz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refund;
