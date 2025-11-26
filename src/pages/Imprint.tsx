import React from 'react';
import { useTranslation } from 'react-i18next';

const Imprint: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t('imprint.title')}</h1>
          <p className="text-lg text-slate-600">{t('imprint.subtitle')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t('imprint.companyInformation')}</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.companyName')}</h3>
                <p className="text-slate-600">{t('imprint.companyNameValue')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.parentCompany')}</h3>
                <p className="text-slate-600">{t('imprint.parentCompanyValue')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.businessType')}</h3>
                <p className="text-slate-600">{t('imprint.businessTypeValue')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.companyDescription')}</h3>
                <p className="text-slate-600">{t('imprint.companyDescriptionValue')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.contactInformation')}</h3>
                <div className="space-y-2 text-slate-600">
                  <p>{t('imprint.email')}: info@rackz.com</p>
                  <p>{t('imprint.website')}: https://getrackz.com</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t('imprint.serviceArea')}</h3>
                <p className="text-slate-600">{t('imprint.serviceAreaValue')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t('imprint.servicesProvided')}</h2>
            <div className="space-y-3 text-slate-600">
              <p>• {t('imprint.service1')}</p>
              <p>• {t('imprint.service2')}</p>
              <p>• {t('imprint.service3')}</p>
              <p>• {t('imprint.service4')}</p>
              <p>• {t('imprint.service5')}</p>
              <p>• {t('imprint.service6')}</p>
              <p>• {t('imprint.service7')}</p>
              <p>• {t('imprint.service8')}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t('imprint.professionalStandards')}</h2>
            <div className="space-y-3 text-slate-600">
              <p>• {t('imprint.standard1')}</p>
              <p>• {t('imprint.standard2')}</p>
              <p>• {t('imprint.standard3')}</p>
              <p>• {t('imprint.standard4')}</p>
              <p>• {t('imprint.standard5')}</p>
              <p>• {t('imprint.standard6')}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-100">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t('imprint.disclaimer')}</h2>
            <p className="text-slate-600 mb-4">
              {t('imprint.disclaimerText1')}
            </p>
            <p className="text-slate-600">
              {t('imprint.disclaimerText2')}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">{t('imprint.contactForLegalMatters')}</h2>
            <div className="space-y-2 text-slate-600">
              <p>{t('imprint.legalContactText')}</p>
              <p className="font-semibold">{t('imprint.email')}: info@rackz.com</p>
              <p>{t('imprint.legalResponseTime')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Imprint;
