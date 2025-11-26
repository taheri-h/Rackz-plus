import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@rackz.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          formType: 'Newsletter Subscription',
          submittedOn: new Date().toLocaleString(),
          subject: 'New Newsletter Subscription'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitStatus('success');
      setEmail('');
      
    } catch (error) {
      console.error('Newsletter submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-black text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img src="/fav.png" alt="Rackz Logo" className="h-12 w-auto" />
            </div>
            <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-400 text-sm">info@rackz.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-400 text-sm">{t('footer.businessHours')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <a 
                  href="https://www.linkedin.com/company/rackz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-slate-400 text-sm">{t('footer.followLinkedIn')}</span>
                </a>
              </div>
            </div>
            
            {/* Newsletter Subscription */}
            <div className="mt-8">
              <h4 className="text-base font-medium mb-4">{t('footer.stayUpdated')}</h4>
              <p className="text-slate-400 text-sm mb-4">{t('footer.newsletterDesc')}</p>
              {submitStatus === 'success' ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm">{t('footer.subscribed')}</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer.emailPlaceholder')}
                    required
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSubmitting
                        ? 'bg-slate-600 cursor-not-allowed text-slate-300'
                        : 'bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {isSubmitting ? '...' : t('footer.subscribe')}
                  </button>
                </form>
              )}
              {submitStatus === 'error' && (
                <p className="text-red-400 text-sm mt-2">{t('footer.subscribeError')}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium mb-4">{t('footer.services')}</h4>
            <ul className="space-y-3">
              <li><button onClick={() => handleSectionClick('services')} className="text-slate-400 hover:text-white transition-colors text-sm text-left">{t('nav.services')}</button></li>
              <li><button onClick={() => handleSectionClick('pricing')} className="text-slate-400 hover:text-white transition-colors text-sm text-left">{t('nav.pricing')}</button></li>
              <li><Link to="/setup" className="text-slate-400 hover:text-white transition-colors text-sm">{t('nav.setup')}</Link></li>
              <li><button onClick={() => handleSectionClick('contact')} className="text-slate-400 hover:text-white transition-colors text-sm text-left">{t('nav.contact')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-medium mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3">
              <li><Link to="/case-studies" className="text-slate-400 hover:text-white transition-colors text-sm">{t('nav.caseStudies')}</Link></li>
              <li><Link to="/blog" className="text-slate-400 hover:text-white transition-colors text-sm">{t('nav.blog')}</Link></li>
              <li><button onClick={() => handleSectionClick('faq')} className="text-slate-400 hover:text-white transition-colors text-sm text-left">{t('nav.faq')}</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="flex flex-wrap gap-6">
                     <Link to="/privacy" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.privacyPolicy')}</Link>
                     <Link to="/terms" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.termsOfService')}</Link>
                     <Link to="/cookies" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.cookiePolicy')}</Link>
                     <Link to="/refund" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.refundPolicy')}</Link>
                     <Link to="/security" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.security')}</Link>
                     <Link to="/imprint" className="text-slate-500 hover:text-white text-sm transition-colors">{t('footer.imprint')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;