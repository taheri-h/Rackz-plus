import React from 'react';
import { useTranslation } from 'react-i18next';

const Cookies: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('cookies.title')}</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            <strong>{t('cookies.lastUpdated')}:</strong> {t('cookies.lastUpdatedDate')}
          </p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('cookies.whatAreCookies')}</h2>
          <p className="text-slate-600 mb-6">
            {t('cookies.whatAreCookiesDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('cookies.howWeUseCookies')}</h2>
          <p className="text-slate-600 mb-6">
            {t('cookies.howWeUseCookiesDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('cookies.typesOfCookies')}</h2>
          <p className="text-slate-600 mb-6">
            {t('cookies.typesOfCookiesDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('cookies.managingCookies')}</h2>
          <p className="text-slate-600 mb-6">
            {t('cookies.managingCookiesDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('cookies.contactUs')}</h2>
          <p className="text-slate-600 mb-6">
            {t('cookies.contactUsDescription')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-slate-600"><strong>{t('cookies.email')}:</strong> info@rackz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
