import React from 'react';
import { useTranslation } from 'react-i18next';

const ComparisonSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="section-spacing bg-slate-50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="heading-lg text-slate-900 mb-6 text-balance">
            {t('comparison.title')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto text-balance">
            {t('comparison.subtitle')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">{t('comparison.table.feature')}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Rackz</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{t('comparison.table.freelancers')}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">{t('comparison.table.agencies')}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">DIY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.price')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('comparison.table.rackzPrice')}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.freelancerPrice')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.agencyPrice')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.freeTimeCost')}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.timeline')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    3-7 days
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">2-4 weeks</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">4-8 weeks</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">1-3 months</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.expertise')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Specialized
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.variable')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.general')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.learningCurve')}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.support')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    30-day warranty
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.limited')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.projectBased')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.selfReliant')}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.security')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    PCI-aware
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.unknown')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.usually')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.yourRisk')}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{t('comparison.table.scalability')}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Built for scale
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.basic')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.good')}</td>
                <td className="px-6 py-4 text-center text-sm text-slate-600">{t('comparison.table.limited')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{t('comparison.whyWins.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">{t('comparison.whyWins.bestValue.title')}</h4>
                <p className="text-sm text-slate-600">{t('comparison.whyWins.bestValue.description')}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">{t('comparison.whyWins.fastestDelivery.title')}</h4>
                <p className="text-sm text-slate-600">{t('comparison.whyWins.fastestDelivery.description')}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-slate-900 mb-2">{t('comparison.whyWins.guaranteedQuality.title')}</h4>
                <p className="text-sm text-slate-600">{t('comparison.whyWins.guaranteedQuality.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
