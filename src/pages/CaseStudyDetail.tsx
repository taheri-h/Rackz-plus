import React, { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { trackCaseStudyView } from '../utils/analytics';

const CaseStudyDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  // Ensure English language
  useEffect(() => {
    i18n.changeLanguage('en');
  }, [i18n]);

  // Scroll to top on page load or when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  // Get case studies data from i18n
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
  const allCaseStudies = caseStudiesData.map((study, index) => ({
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

  // Find the case study based on the slug
  const caseStudy = allCaseStudies.find(study => study.slug === slug) || allCaseStudies[0];

  // Get related case studies (exclude current one)
  const relatedCaseStudies = allCaseStudies
    .filter(study => study.slug !== slug)
    .slice(0, 3)
    .map(study => ({
      title: study.title,
      slug: study.slug,
      industry: study.industry
    }));

  useEffect(() => {
    trackCaseStudyView(caseStudy.title);
  }, [caseStudy.title]);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{caseStudy.title} - {t('caseStudies.meta.caseStudyTitle')}</title>
        <meta name="description" content={`${(caseStudy as any).description || caseStudy.challenge} See how ${caseStudy.company} achieved ${caseStudy.results.growth} growth with our payment integration services.`} />
        <meta name="keywords" content={`${caseStudy.industry} case study, payment integration success, ${caseStudy.company}, subscription billing, payment processing results`} />
        <link rel="canonical" href={`https://getrackz.com/case-studies/${slug}`} />
        <meta property="og:title" content={caseStudy.title} />
        <meta property="og:description" content={caseStudy.testimonial} />
        <meta property="og:url" content={`https://getrackz.com/case-studies/${slug}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CaseStudy",
            "name": caseStudy.title,
            "description": caseStudy.testimonial,
            "url": `https://getrackz.com/case-studies/${slug}`,
            "about": {
              "@type": "Organization",
              "name": caseStudy.company
            },
            "author": {
              "@type": "Organization",
              "name": "Rackz"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Rackz",
              "url": "https://getrackz.com"
            },
            "industry": caseStudy.industry,
            "result": {
              "@type": "QuantitativeValue",
              "value": caseStudy.results.growth,
              "unitText": "growth"
            }
          })}
        </script>
      </Helmet>
      {/* Case Study Header */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-700">Home</Link>
            <span>/</span>
            <Link to="/case-studies" className="hover:text-slate-700">Case Studies</Link>
            <span>/</span>
            <span className="text-slate-700">{caseStudy.industry}</span>
          </div>
        </nav>

        {/* Case Study Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              {caseStudy.industry}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {caseStudy.title}
          </h1>
          
          <div className="flex items-center justify-between text-slate-600 mb-8">
            <div className="flex items-center space-x-4">
              <span><strong>Client:</strong> {caseStudy.client}</span>
              <span>•</span>
              <span><strong>Company:</strong> {caseStudy.company}</span>
            </div>
          </div>
        </div>

        {/* Case Study Image */}
        <div className="aspect-video rounded-lg mb-12 overflow-hidden">
          <img 
            src={caseStudy.image} 
            alt={caseStudy.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Key Results Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(caseStudy.results).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
                <div className="text-sm text-slate-600 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Study Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <h2>The Challenge</h2>
          <p>{caseStudy.challenge}</p>
          
          <p>When {caseStudy.client} first approached Rackz, they were facing significant challenges in their payment processing. As a growing business in the {caseStudy.industry.toLowerCase()} industry, they needed a solution that could scale with their growth while maintaining security and compliance.</p>

          <h2>Our Solution</h2>
          <p>{caseStudy.solution}</p>
          
          <p>We worked closely with {caseStudy.client} to understand their specific needs and challenges. Our team conducted a thorough analysis of their current payment flow and identified key areas for improvement.</p>

          <h3>Implementation Process</h3>
          <ol>
            <li><strong>Analysis:</strong> We analyzed their current payment processing and identified bottlenecks</li>
            <li><strong>Strategy:</strong> Developed a comprehensive payment strategy tailored to their business model</li>
            <li><strong>Integration:</strong> Implemented the solution with minimal disruption to their operations</li>
            <li><strong>Testing:</strong> Conducted thorough testing to ensure everything worked perfectly</li>
            <li><strong>Launch:</strong> Launched the new payment system with full support</li>
          </ol>

          <h2>Key Features Implemented</h2>
          <ul>
            <li>Secure payment processing with PCI compliance</li>
            <li>Automated billing and invoicing</li>
            <li>Real-time payment analytics and reporting</li>
            <li>Mobile-optimized payment forms</li>
            <li>Comprehensive error handling and retry logic</li>
            <li>Integration with existing business systems</li>
          </ul>

          <h2>The Results</h2>
          <p>The implementation was a complete success. {caseStudy.client} saw immediate improvements in their payment processing efficiency and customer experience.</p>

          <blockquote className="border-l-4 border-blue-500 pl-6 italic text-slate-700 my-8">
            "{caseStudy.testimonial}"
            <footer className="mt-4 text-sm text-slate-600">{caseStudy.client}, {caseStudy.company}</footer>
          </blockquote>

          <h2>Lessons Learned</h2>
          <p>This case study demonstrates several key principles for successful payment integration:</p>
          
          <ul>
            <li><strong>Customization is Key:</strong> Every business has unique needs that require tailored solutions</li>
            <li><strong>Security First:</strong> Implementing robust security measures from the start prevents issues later</li>
            <li><strong>User Experience Matters:</strong> Smooth payment flows significantly impact conversion rates</li>
            <li><strong>Analytics Drive Optimization:</strong> Data-driven insights help continuously improve performance</li>
          </ul>

          <h2>Conclusion</h2>
          <p>The success of {caseStudy.company} demonstrates how the right payment integration can transform a business. By focusing on security, user experience, and scalability, we were able to help them achieve remarkable growth.</p>

          <p>Ready to transform your payment processing? Contact our team at Rackz to discuss how we can help your business achieve similar results.</p>
        </div>

        {/* Client Testimonial */}
        <div className="bg-slate-50 rounded-lg p-8 mb-12">
          <blockquote className="text-lg text-slate-700 italic mb-4">
            "{caseStudy.testimonial}"
          </blockquote>
          <cite className="text-slate-600 font-medium">
            - {caseStudy.client}, {caseStudy.company}
          </cite>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to Achieve Similar Results?
          </h3>
          <p className="text-slate-600 mb-6">
            Our expert team can help you implement the same payment solutions that drove these results. 
            Get your payment gateway live in 3-7 days with our proven integration process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://calendly.com/fynteq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary"
            >
              Get Free Consultation
            </a>
            <Link to="/#pricing" className="button-secondary">
              View Pricing
            </Link>
          </div>
        </div>

        {/* Related Case Studies */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Related Case Studies</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedCaseStudies.map((study, index) => (
              <div key={index} className="card hover-lift">
                <div className="p-6">
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full mb-3 inline-block">
                    {study.industry}
                  </span>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    <Link to={`/case-studies/${study.slug}`} className="hover:text-blue-600 transition-colors">
                      {study.title}
                    </Link>
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">More Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">
                <Link to="/case-studies" className="hover:text-blue-600 transition-colors">
                  All Case Studies
                </Link>
              </h4>
              <p className="text-slate-600 mb-4">Explore our complete collection of success stories from businesses across different industries.</p>
              <Link to="/case-studies" className="text-blue-600 hover:text-blue-700 font-medium">
                Browse All Case Studies →
              </Link>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-3">
                <Link to="/blog" className="hover:text-blue-600 transition-colors">
                  Expert Articles
                </Link>
              </h4>
              <p className="text-slate-600 mb-4">Learn from our latest articles on payment integration, best practices, and industry insights.</p>
              <Link to="/blog" className="text-blue-600 hover:text-blue-700 font-medium">
                Read Our Blog →
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default CaseStudyDetail;
