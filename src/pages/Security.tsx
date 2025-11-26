import React from 'react';
import { useTranslation } from 'react-i18next';

const Security: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('security.title')}</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            <strong>{t('security.lastUpdated')}:</strong> {t('security.lastUpdatedDate')}
          </p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('security.pciDssCompliance')}</h2>
          <p className="text-slate-600 mb-6">
            {t('security.pciDssComplianceDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('security.dataEncryption')}</h2>
          <p className="text-slate-600 mb-6">
            {t('security.dataEncryptionDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('security.securityMeasures')}</h2>
          <p className="text-slate-600 mb-6">
            {t('security.securityMeasuresDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('security.uptimeGuarantee')}</h2>
          <p className="text-slate-600 mb-6">
            {t('security.uptimeGuaranteeDescription')}
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mb-4">{t('security.contactSecurityTeam')}</h2>
          <p className="text-slate-600 mb-6">
            {t('security.contactSecurityTeamDescription')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-slate-600"><strong>{t('security.securityTeam')}:</strong> info@rackz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
