import React from 'react';
import { useTranslation } from 'react-i18next';

const Terms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('terms.title')}</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            <strong>{t('terms.lastUpdated')}:</strong> {t('terms.lastUpdatedDate')}
          </p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('terms.acceptanceOfTerms')}</h2>
          <p className="text-slate-600 mb-6">
            {t('terms.acceptanceOfTermsDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('terms.serviceDescription')}</h2>
          <p className="text-slate-600 mb-6">
            {t('terms.serviceDescriptionDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('terms.paymentTerms')}</h2>
          <p className="text-slate-600 mb-6">
            {t('terms.paymentTermsDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('terms.limitationOfLiability')}</h2>
          <p className="text-slate-600 mb-6">
            {t('terms.limitationOfLiabilityDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('terms.contactInformation')}</h2>
          <p className="text-slate-600 mb-6">
            {t('terms.contactInformationDescription')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-slate-600"><strong>{t('terms.email')}:</strong> info@rackz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
