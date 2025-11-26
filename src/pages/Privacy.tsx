import React from 'react';
import { useTranslation } from 'react-i18next';

const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('privacy.title')}</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            <strong>{t('privacy.lastUpdated')}:</strong> {t('privacy.lastUpdatedDate')}
          </p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('privacy.informationWeCollect')}</h2>
          <p className="text-slate-600 mb-6">
            {t('privacy.informationWeCollectDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('privacy.howWeUseInformation')}</h2>
          <p className="text-slate-600 mb-6">
            {t('privacy.howWeUseInformationDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('privacy.informationSharing')}</h2>
          <p className="text-slate-600 mb-6">
            {t('privacy.informationSharingDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('privacy.dataSecurity')}</h2>
          <p className="text-slate-600 mb-6">
            {t('privacy.dataSecurityDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('privacy.contactUs')}</h2>
          <p className="text-slate-600 mb-6">
            {t('privacy.contactUsDescription')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-slate-600"><strong>{t('privacy.email')}:</strong> info@rackz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
