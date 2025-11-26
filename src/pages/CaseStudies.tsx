import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const CaseStudies: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedIndustry, setSelectedIndustry] = useState(t('caseStudies.industries.all'));
  const location = useLocation();
  
  // Update selected industry when language changes
  useEffect(() => {
    setSelectedIndustry(t('caseStudies.industries.all'));
  }, [i18n.language, t]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSectionClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on other pages, navigate to home with hash
      window.location.href = `/#${sectionId}`;
    }
  };

  const caseStudiesData = t('caseStudies.detailed', { returnObjects: true }) as Array<{
    id: number;
    title: string;
    industry: string;
    client: string;
    company: string;
    challenge: string;
    solution: string;
    results: {
      revenueIncrease: string;
      churnReduction: string;
      customerRetention: string;
    };
    description: string;
    image: string;
    slug: string;
  }>;

  // Add additional fields to case studies
  const caseStudies = caseStudiesData.map((study, index) => ({
    ...study,
    testimonial: "Rackz transformed our business with professional payment integration services.",
    results: {
      ...study.results,
      revenue: "$8,500/month",
      growth: study.results.revenueIncrease,
      churn: study.results.churnReduction + " reduction",
      setup: "3 days"
    }
  }));

  // Create industry mapping for filtering
  const industryMapping: { [key: string]: string } = {
    [t('caseStudies.industries.all')]: 'All',
    [t('caseStudies.industries.fitnessWellness')]: 'Fitness & Wellness',
    [t('caseStudies.industries.ecommerce')]: 'E-commerce',
    [t('caseStudies.industries.saas')]: 'SaaS',
    [t('caseStudies.industries.marketplace')]: 'Marketplace',
    [t('caseStudies.industries.nonProfit')]: 'Non-Profit',
    [t('caseStudies.industries.education')]: 'Education'
  };

  const industries = [
    t('caseStudies.industries.all'),
    t('caseStudies.industries.fitnessWellness'),
    t('caseStudies.industries.ecommerce'),
    t('caseStudies.industries.saas'),
    t('caseStudies.industries.marketplace'),
    t('caseStudies.industries.nonProfit'),
    t('caseStudies.industries.education')
  ];

  const filteredCaseStudies = selectedIndustry === t('caseStudies.industries.all')
    ? caseStudies 
    : caseStudies.filter(study => study.industry === (industryMapping[selectedIndustry] as string || ''));

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{t('caseStudies.meta.title')}</title>
        <meta name="description" content={t('caseStudies.meta.description')} />
        <meta name="keywords" content={t('caseStudies.meta.keywords')} />
        <link rel="canonical" href="https://getrackz.com/case-studies" />
        <meta property="og:title" content={t('caseStudies.meta.title')} />
        <meta property="og:description" content={t('caseStudies.meta.description')} />
        <meta property="og:url" content="https://getrackz.com/case-studies" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": t('caseStudies.meta.title'),
            "description": t('caseStudies.meta.description'),
            "url": "https://getrackz.com/case-studies",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": caseStudies.map((study, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "CaseStudy",
                  "name": study.title,
                  "description": study.description,
                  "about": study.industry,
                  "url": `https://getrackz.com/case-studies/${study.slug}`
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            {t('caseStudies.title')}
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {t('caseStudies.subtitle')}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {industries.map((industry) => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedIndustry === industry
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {industry}
            </button>
          ))}
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredCaseStudies.map((study, index) => (
            <Link
              key={study.id}
              to={`/case-studies/${study.slug}`}
              className="group card overflow-hidden"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={study.image}
                  alt={study.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">
                    {study.industry}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                  {study.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {study.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{study.client}</p>
                    <p className="text-xs text-slate-600">{study.company}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-900 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-slate-50 rounded-xl p-12 border border-slate-100">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t('caseStudies.cta.title')}
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('caseStudies.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/fynteq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary inline-flex items-center px-8 py-4"
            >
              {t('hero.freeConsultation')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={() => handleSectionClick('pricing')}
              className="button-secondary inline-flex items-center px-8 py-4"
            >
              {t('caseStudies.viewPricing')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudies;